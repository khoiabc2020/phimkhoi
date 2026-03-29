import {
    View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions,
    StyleSheet, Platform, Animated, Modal, StatusBar as RNStatusBar, useWindowDimensions, Share
} from 'react-native';
import { useLocalSearchParams, Stack, Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SafeAreaView } from 'react-native-safe-area-context';

import { getMovieDetail, getImageUrl, getRelatedMovies, Movie, getTMDBRating, getOphimCast, toggleFavorite as apiToggleFavorite, getHistory, parseServerLabel, getRating, postRating } from '@/services/api';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { addToWatchList, removeFromWatchList, isInWatchList } from '@/lib/watchList';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { COLORS, BLUR } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { addDownload, getDownloads } from '@/lib/downloads';
import CommentSection from '@/components/CommentSection';

// Episode grid — iOS 26: gap 6dp, 5 cột, box 40dp, viền 1dp tinh tế
const EP_GAP = 6;
const BODY_PADDING = 16;
const EP_BOX_HEIGHT = 40;

const { width: dimWidth, height } = Dimensions.get('window');

// Language group colors (matching web version)
const LANG_COLORS: Record<string, string> = {
    "Phụ Đề": '#D1D5DB',
    "Lồng Tiếng": '#00C853',
    "Thuyết Minh": '#3B82F6',
};

const getLanguageGroup = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('lồng tiếng') || lower.includes('longtieng')) return 'Lồng Tiếng';
    if (lower.includes('thuyết minh') || lower.includes('thuyetminh')) return 'Thuyết Minh';
    return 'Phụ Đề';
};

// Tab options
const TABS = [
    { id: 'episodes', label: 'Tập phim' },
    { id: 'related', label: 'Đề xuất' },
    { id: 'actors', label: 'Diễn viên' },
    { id: 'comments', label: 'Bình luận' },
];
const DETAIL_CACHE_PREFIX = 'movie_detail_cache_v1:';
const HOME_CACHE_KEY = 'home_screen_cache_v3';
const DETAIL_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

export default function MovieDetailScreen() {
    const { slug, autoPlay } = useLocalSearchParams();
    const slugStr = Array.isArray(slug) ? slug[0] : String(slug || '');
    const router = useRouter();
    const { width: winWidth } = useWindowDimensions();
    const screenW = Math.max(Number(winWidth) || dimWidth, 320);
    const contentWidth = screenW - BODY_PADDING * 2;
    const isTablet = screenW >= 768;
    const epCols = isTablet ? Math.floor(contentWidth / 80) : (contentWidth < 340 ? 4 : 5);
    const epCardWidth = Math.floor((contentWidth - EP_GAP * (epCols - 1)) / epCols);

    // Data State
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [inWatchList, setInWatchList] = useState(false);
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    // UI State
    const [selectedTab, setSelectedTab] = useState('episodes');
    const [selectedServer, setSelectedServer] = useState(0); // global index into `episodes`
    const [activeLangTab, setActiveLangTab] = useState('');
    const [rating, setRating] = useState<number | null>(null);
    const [dbRating, setDbRating] = useState<{ average: number; count: number; userRating: number | null }>({ average: 0, count: 0, userRating: null });
    const [cast, setCast] = useState<any[]>([]);
    const [selectedEpRange, setSelectedEpRange] = useState(0);
    const [showDownloadSheet, setShowDownloadSheet] = useState(false);
    const [downloadEpSlugs, setDownloadEpSlugs] = useState<Set<string>>(new Set());
    const [localUriByEp, setLocalUriByEp] = useState<Record<string, string>>({});
    const EP_CHUNK = 50;

    // Group non-empty servers by language
    const filteredEpisodes = episodes.filter(s => s.server_data && s.server_data.length > 0);
    const groupedEpisodes: Record<string, any[]> = { 'Phụ Đề': [], 'Lồng Tiếng': [], 'Thuyết Minh': [] };
    filteredEpisodes.forEach(s => groupedEpisodes[getLanguageGroup(s.server_name)].push(s));
    const activeLangGroups = Object.keys(groupedEpisodes).filter(k => groupedEpisodes[k].length > 0);

    const { user, token, syncFavorites, syncWatchList } = useAuth();

    // Watch History for Resume
    const [historyRecord, setHistoryRecord] = useState<any>(null);
    const hydratedFromCacheRef = useRef(false);

    const applyMoviePayload = useCallback((payload: any) => {
        if (!payload?.movie) return;
        const eps = payload.episodes || [];
        setMovie(payload.movie);
        setEpisodes(eps);
        const firstNonEmpty = eps.findIndex((s: any) => s.server_data && s.server_data.length > 0);
        const initIndex = firstNonEmpty !== -1 ? firstNonEmpty : 0;
        setSelectedServer(initIndex);
        setActiveLangTab(getLanguageGroup(eps[initIndex]?.server_name || ''));
    }, []);

    const warmStartFromCache = useCallback(async () => {
        if (!slugStr) return;
        try {
            const cacheRaw = await AsyncStorage.getItem(`${DETAIL_CACHE_PREFIX}${slugStr}`);
            if (cacheRaw) {
                const parsed = JSON.parse(cacheRaw);
                if (parsed?.ts && Date.now() - parsed.ts < DETAIL_CACHE_TTL && parsed?.data?.movie) {
                    applyMoviePayload(parsed.data);
                    hydratedFromCacheRef.current = true;
                    setLoading(false);
                    return;
                }
            }

            // Fallback: if detail cache missing, hydrate basic info from home cache.
            const homeRaw = await AsyncStorage.getItem(HOME_CACHE_KEY);
            if (homeRaw) {
                const home = JSON.parse(homeRaw) || {};
                const pools = [
                    ...(home.heroMovies || []),
                    ...(home.phimMoi || []),
                    ...(home.phimLe || []),
                    ...(home.phimBo || []),
                    ...(home.hoatHinh || []),
                    ...(home.tvShows || []),
                    ...(home.phimChieuRap || []),
                    ...(home.phimSapChieu || []),
                    ...(home.hanQuoc || []),
                    ...(home.trungQuoc || []),
                    ...(home.hanhDong || []),
                    ...(home.tinhCam || []),
                ];
                const quickMovie = pools.find((m: any) => m?.slug === slugStr);
                if (quickMovie) {
                    setMovie(quickMovie);
                    hydratedFromCacheRef.current = true;
                    setLoading(false);
                }
            }
        } catch (e) {
            // ignore cache errors
        }
    }, [slugStr, applyMoviePayload]);

    useEffect(() => {
        if (!movie?.slug) return;
        getDownloads().then((list) => {
            const item = list.find((m) => m.movieSlug === movie.slug);
            const map: Record<string, string> = {};
            item?.episodes.forEach((e) => {
                if (e.status === 'done' && e.localUri) map[e.slug] = e.localUri;
            });
            setLocalUriByEp(map);
        });
    }, [movie?.slug]);

    const fetchData = useCallback(async () => {
        if (!slugStr) return;
        try {
            if (!hydratedFromCacheRef.current) setLoading(true);
            const data = await getMovieDetail(slugStr);
            if (data?.movie) {
                applyMoviePayload(data);
                setLoading(false); // show detail immediately when core payload is ready

                // Handle AutoPlay flag immediately after data fetches
                const isAutoPlay = Array.isArray(autoPlay) ? autoPlay[0] === 'true' : autoPlay === 'true';
                const eps = data.episodes || [];
                const firstNonEmpty = eps.findIndex((s: any) => s.server_data && s.server_data.length > 0);
                const initIndex = firstNonEmpty !== -1 ? firstNonEmpty : 0;
                if (isAutoPlay && eps[initIndex]?.server_data?.[0]) {
                    const firstEp = eps[initIndex].server_data[0].slug;
                    router.replace(`/player/${data.movie.slug}?ep=${firstEp}&server=${initIndex}` as any);
                }

                // cache full detail for instant next open
                AsyncStorage.setItem(
                    `${DETAIL_CACHE_PREFIX}${slugStr}`,
                    JSON.stringify({ ts: Date.now(), data: { movie: data.movie, episodes: eps } })
                ).catch(() => { });

                // load secondary sections in background (non-blocking)
                Promise.allSettled([
                    getRelatedMovies(data.movie.category?.[0]?.slug || ''),
                    getTMDBRating(data.movie.name, data.movie.year),
                    getOphimCast(data.movie.slug, data.movie.origin_name || data.movie.name, data.movie.year, data.movie),
                    getRating(data.movie.slug, token || undefined),
                ]).then(([relatedResult, ratingResult, castResult, dbRatingResult]) => {
                    if (relatedResult.status === 'fulfilled') setRelatedMovies(relatedResult.value);
                    if (ratingResult.status === 'fulfilled' && ratingResult.value) setRating(ratingResult.value);
                    if (castResult.status === 'fulfilled' && castResult.value) setCast(castResult.value.slice(0, 15));
                    if (dbRatingResult.status === 'fulfilled' && dbRatingResult.value.count > 0) setDbRating(dbRatingResult.value);
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [slugStr, autoPlay, router, applyMoviePayload]);

    useEffect(() => {
        if (token && slugStr) {
            getHistory(token).then((hist: any[]) => {
                const match = hist.find(h => h.slug === slugStr);
                if (match) setHistoryRecord(match);
            }).catch(() => { });
        }
    }, [token, slugStr]);

    useEffect(() => {
        warmStartFromCache().finally(() => {
            fetchData();
        });
    }, [warmStartFromCache, fetchData]);

    // Favorite Logic
    const checkFavorite = useCallback(async () => {
        if (!movie) return;
        try {
            if (user?.favorites) {
                setFav(user.favorites.some((f: any) => (typeof f === 'string' ? f : f.slug) === movie.slug));
            } else {
                setFav(await isFavorite(movie.slug));
            }
        } catch (e) { console.warn(e); }
    }, [movie, user]);

    useEffect(() => { checkFavorite(); }, [checkFavorite]);

    const toggleFavoriteAction = async () => {
        if (!movie) return;
        const newState = !fav;
        setFav(newState); // Optimistic

        try {
            if (user && token) {
                await apiToggleFavorite(movie, fav, token); // isFav = old state
                syncFavorites();
            } else {
                if (newState) {
                    await addFavorite({
                        movieId: movie._id || movie.slug,
                        movieSlug: movie.slug,
                        movieName: movie.name,
                        movieOriginName: movie.origin_name || '',
                        moviePoster: movie.poster_url || movie.thumb_url || '',
                        movieYear: movie.year || new Date().getFullYear(),
                        movieQuality: movie.quality || 'HD',
                        movieCategories: movie.category ? movie.category.map((c: any) => c.name) : [],
                    });
                } else {
                    await removeFavorite(movie.slug);
                }
            }
        } catch (e) {
            setFav(!newState); // Revert
            console.error(e);
        }
    };

    // Watchlist Logic
    const checkWatchList = useCallback(async () => {
        if (!movie) return;
        try {
            if (user?.watchlist) {
                setInWatchList(user.watchlist.some((w: any) => (typeof w === 'string' ? w : w.slug) === movie.slug));
            } else {
                setInWatchList(await isInWatchList(movie._id || movie.slug));
            }
        } catch (e) { console.warn(e); }
    }, [movie, user]);

    useEffect(() => { checkWatchList(); }, [checkWatchList]);

    const toggleWatchList = async () => {
        if (!movie) return;
        const newState = !inWatchList;
        setInWatchList(newState); // Optimistic UI

        try {
            if (user && token) {
                const method = newState ? 'POST' : 'DELETE';
                const payload = newState ? {
                    movieId: movie._id,
                    movieSlug: movie.slug,
                    movieName: movie.name,
                    movieOriginName: movie.origin_name || "",
                    moviePoster: movie.thumb_url || movie.poster_url,
                    movieYear: movie.year || new Date().getFullYear(),
                    movieQuality: movie.quality || "HD",
                    movieCategories: movie.category ? movie.category.map((c: any) => c.name) : []
                } : { slug: movie.slug };

                await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                    method,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                syncWatchList();
            } else {
                if (newState) {
                    await addToWatchList({
                        _id: movie._id || movie.slug,
                        slug: movie.slug,
                        name: movie.name,
                        poster_url: movie.poster_url,
                        thumb_url: movie.thumb_url,
                    });
                } else {
                    await removeFromWatchList(movie._id || movie.slug);
                }
            }
        } catch (e) {
            setInWatchList(!newState); // Revert
            console.error(e);
        }
    };

    // Share feature
    const handleShare = async () => {
        if (!movie) return;
        try {
            await Share.share({
                title: movie.name,
                message: `🎬 ${movie.name} (${movie.origin_name || ''})\n\nXem ngay tại: https://khoiphim.io.vn/phim/${movie.slug}`,
                url: `https://khoiphim.io.vn/phim/${movie.slug}`,
            });
        } catch (e) {
            console.warn('Share failed', e);
        }
    };


    // Loading State
    if (loading) {
        return (
            <View style={styles.centerLoading}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    if (!movie) {
        return (
            <View style={styles.centerLoading}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="film-outline" size={64} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 16 }}>
                    Không tìm thấy thông tin phim
                </Text>
                <Pressable
                    style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Quay lại</Text>
                </Pressable>
            </View>
        );
    }

    const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const currentServerData = episodes[selectedServer]?.server_data || [];
    const firstEpisode = currentServerData[0];
    const serverName = episodes[selectedServer]?.server_name || `Server ${selectedServer + 1}`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* HEADER — liquid glass */}
            <View style={styles.headerContainer}>
                <BlurView intensity={Platform.OS === 'ios' ? BLUR.header : 80} tint="dark" style={StyleSheet.absoluteFill} />
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.headerRow}>
                        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </Pressable>
                        <View style={{ flex: 1 }} />
                        <Pressable style={styles.iconBtn} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={22} color="white" />
                        </Pressable>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* HERO IMAGE */}
                <View style={{ height: isTablet ? Math.min(screenW * (9 / 16), 600) : height * 0.45, width: '100%' }}>
                    <Image
                        source={{ uri: posterUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={500}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(11,13,18,0)', 'rgba(11,13,18,1)']}
                        style={StyleSheet.absoluteFill}
                        locations={[0, 0.6, 1]}
                    />

                    <View style={styles.heroContent}>
                        <Text style={styles.movieTitle} numberOfLines={2}>{movie.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                            <Text style={styles.movieSubtitle}>{movie.origin_name}</Text>
                            <View style={styles.dot} />
                            <Text style={styles.movieSubtitle}>{movie.year}</Text>
                        </View>

                        <View style={styles.chipRow}>
                            <View style={styles.glassChip}>
                                <Text style={styles.chipText}>{movie.quality || 'HD'}</Text>
                            </View>
                            <View style={[styles.glassChip, { borderColor: COLORS.accent }]}>
                                <Text style={[styles.chipText, { color: COLORS.accent }]}>{movie.lang || 'Vietsub'}</Text>
                            </View>
                            {typeof rating === 'number' && !isNaN(rating) && (
                                <View style={[styles.glassChip, { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}>
                                    <Text style={[styles.chipText, { color: 'black', fontWeight: 'bold' }]}>IMDb {rating.toFixed(1)}</Text>
                                </View>
                            )}
                            {dbRating.count > 0 && (
                                <View style={[styles.glassChip, { backgroundColor: 'rgba(255,180,0,0.15)', borderColor: 'rgba(255,180,0,0.5)' }]}>
                                    <Ionicons name="star" size={11} color="#FFB400" />
                                    <Text style={[styles.chipText, { color: '#FFB400', fontWeight: 'bold' }]}>{dbRating.average.toFixed(1)} ({dbRating.count})</Text>
                                </View>
                            )}
                        </View>

                        {/* Status Badge — Hoàn Tất vs Đang chiếu */}
                        {(() => {
                            const ep = movie.episode_current || '';
                            const isCompleted = ep.toLowerCase().includes('hoàn tất') || ep.toLowerCase().includes('full');
                            const total = movie.episode_total || '?';
                            const epNum = ep.replace(/hoàn tất/gi, '').replace(/\(.*?\)/g, '').trim() || '1';
                            const formattedEp = epNum.toLowerCase().includes('tập') ? epNum : `Tập ${epNum}`;
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 6,
                                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                                        backgroundColor: isCompleted ? 'rgba(34,197,94,0.15)' : 'rgba(143,167,197,0.15)',
                                        borderWidth: 1,
                                        borderColor: isCompleted ? 'rgba(34,197,94,0.4)' : 'rgba(143,167,197,0.4)',
                                    }}>
                                        <View style={{
                                            width: 6, height: 6, borderRadius: 3,
                                            backgroundColor: isCompleted ? '#22c55e' : COLORS.accent,
                                        }} />
                                        <Text style={{ color: isCompleted ? '#22c55e' : COLORS.accent, fontSize: 12, fontWeight: '700' }}>
                                            {isCompleted ? 'Hoàn Tất' : 'Đang chiếu'}
                                        </Text>
                                    </View>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                                        {isCompleted ? `${total} tập` : `${formattedEp} / ${total}`}
                                    </Text>
                                </View>
                            );
                        })()}
                        {/* Director from source data (always correct) */}
                        {movie.director && movie.director.length > 0 && !movie.director.includes('Đang cập nhật') && (
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.35)' }}>Đạo diễn: </Text>
                                {movie.director.join(', ')}
                            </Text>
                        )}
                    </View>

                </View>

                {/* BODY — Xem phim, Yêu thích, Thêm danh sách, Tải xuống cùng 1 hàng, nút Xem thu gọn */}
                <View style={styles.bodyContent}>
                    <View style={styles.actionRowFull}>
                        <Pressable
                            style={[
                                styles.playBtnCompact,
                                !firstEpisode && styles.playBtnCompactDisabled,
                                { overflow: 'hidden' } // for the progress bar overlay
                            ]}
                            disabled={!firstEpisode}
                            onPress={() => {
                                if (!firstEpisode) return;
                                if (historyRecord?.episode) {
                                    router.push(`/player/${movie.slug}?ep=${historyRecord.episode}&server=${selectedServer}` as any);
                                } else {
                                    router.push(`/player/${movie.slug}?ep=${firstEpisode.slug}&server=${selectedServer}` as any);
                                }
                            }}
                        >
                            <Ionicons name="play" size={18} color="#0B0D12" />
                            <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 4 }}>
                                <Text style={styles.playBtnCompactText} numberOfLines={1}>
                                    {historyRecord ? 'Tiếp tục xem' : (firstEpisode ? 'Xem' : '—')}
                                </Text>
                                {historyRecord && (
                                    <Text style={{ fontSize: 9, color: 'rgba(0,0,0,0.6)', fontWeight: '700', marginTop: -2 }} numberOfLines={1}>
                                        {historyRecord.episode_name || historyRecord.episode}
                                    </Text>
                                )}
                            </View>

                            {/* Resume Progress Bar */}
                            {historyRecord && historyRecord.duration > 0 && (
                                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                    <View style={{
                                        height: '100%',
                                        backgroundColor: COLORS.accent,
                                        width: `${Math.min(100, (historyRecord.progress / historyRecord.duration) * 100)}%`
                                    }} />
                                </View>
                            )}
                        </Pressable>

                        <Pressable
                            onPress={toggleFavoriteAction}
                            style={[styles.actionIconBtn, fav && { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: COLORS.accent }]}
                        >
                            <Ionicons name={fav ? "heart" : "heart-outline"} size={22} color={fav ? COLORS.accent : 'white'} />
                        </Pressable>

                        <Pressable
                            onPress={toggleWatchList}
                            style={[styles.actionIconBtn, inWatchList && { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'white' }]}
                        >
                            <Ionicons name={inWatchList ? "checkmark-circle" : "add-circle-outline"} size={22} color="white" />
                        </Pressable>

                        {!Platform.isTV && currentServerData.length > 0 && (
                            <Pressable
                                style={styles.actionIconBtn}
                                onPress={() => {
                                    setDownloadEpSlugs(new Set(currentServerData.map((e: any) => e.slug)));
                                    setShowDownloadSheet(true);
                                }}
                            >
                                <Ionicons name="cloud-download-outline" size={22} color="white" />
                            </Pressable>
                        )}
                    </View>

                    {/* Language Tabs + Server Selector */}
                    {activeLangGroups.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            {/* Lang tabs row */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 0 }}>
                                    {activeLangGroups.map(lang => {
                                        const isActive = activeLangTab === lang;
                                        const dotColor = LANG_COLORS[lang] || '#9ca3af';

                                        const serversInGroup = groupedEpisodes[lang];
                                        const label = lang;

                                        return (
                                            <Pressable
                                                key={lang}
                                                onPress={() => {
                                                    setActiveLangTab(lang);
                                                    const firstInGroup = groupedEpisodes[lang][0];
                                                    if (firstInGroup) {
                                                        const globalIdx = episodes.findIndex(e => e.server_name === firstInGroup.server_name);
                                                        if (globalIdx !== -1) setSelectedServer(globalIdx);
                                                    }
                                                    setSelectedEpRange(0);
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    backgroundColor: isActive ? 'rgba(143,167,197,0.15)' : 'rgba(255,255,255,0.05)',
                                                    borderWidth: 1,
                                                    borderColor: isActive ? COLORS.accent : 'rgba(255,255,255,0.08)',
                                                }}
                                            >
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isActive ? dotColor : 'rgba(255,255,255,0.25)' }} />
                                                <Text style={{ color: isActive ? COLORS.accent : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: isActive ? '700' : '500' }}>
                                                    {label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            {activeLangTab && groupedEpisodes[activeLangTab]?.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {groupedEpisodes[activeLangTab].map((server: any) => {
                                            const globalIdx = episodes.findIndex(e => e.server_name === server.server_name);
                                            const isActive = selectedServer === globalIdx;
                                            const allServerNames = episodes.map((e: any) => e.server_name);
                                            const shortName = parseServerLabel(server.server_name || '', allServerNames);

                                            return (
                                                <Pressable
                                                    key={globalIdx}
                                                    onPress={() => { setSelectedServer(globalIdx); setSelectedEpRange(0); }}
                                                    style={[
                                                        styles.selectorPill,
                                                        isActive && { backgroundColor: 'rgba(143,167,197,0.15)', borderColor: COLORS.accent }
                                                    ]}
                                                >
                                                    <Text style={[styles.selectorText, isActive && { color: COLORS.accent, fontWeight: '600' }]}>
                                                        {shortName}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* TABS — liquid glass */}
                    <View style={styles.tabContainerWrap}>
                        <BlurView intensity={Platform.OS === 'ios' ? BLUR.glassCard : 60} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.tabContainer} pointerEvents="box-none">
                            {TABS.map(tab => (
                                <Pressable
                                    key={tab.id}
                                    style={[styles.tabItem, selectedTab === tab.id && styles.tabItemActive]}
                                    onPress={() => setSelectedTab(tab.id)}
                                >
                                    <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* CONTENT */}
                    <View style={{ minHeight: 300 }}>
                        {selectedTab === 'episodes' && (
                            <View>
                                {/* Range Picker - only show if many episodes */}
                                {currentServerData.length > EP_CHUNK && (() => {
                                    const totalGroups = Math.ceil(currentServerData.length / EP_CHUNK);
                                    return (
                                        <View style={{ height: 44, marginBottom: 4 }}>
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                style={{ flexGrow: 0 }}
                                                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center', flexGrow: 0 }}
                                            >
                                                {Array.from({ length: totalGroups }).map((_, i) => {
                                                    const from = i * EP_CHUNK + 1;
                                                    const to = Math.min((i + 1) * EP_CHUNK, currentServerData.length);
                                                    return (
                                                        <Pressable
                                                            key={i}
                                                            onPress={() => setSelectedEpRange(i)}
                                                            style={[
                                                                styles.rangeBtn,
                                                                selectedEpRange === i && styles.rangeBtnActive
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[styles.rangeBtnText, selectedEpRange === i && styles.rangeBtnTextActive]}
                                                                numberOfLines={1}
                                                                adjustsFontSizeToFit
                                                                minimumFontScale={0.85}
                                                            >
                                                                {from}–{to}
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    );
                                })()}

                                {/* Episode Grid — mỗi hàng đúng epCols (4 hoặc 5) ô, width cố định */}
                                {currentServerData.length === 0 ? (
                                    <Text style={{ color: 'gray', textAlign: 'center', width: '100%', marginTop: 20 }}>Chưa có tập phim nào.</Text>
                                ) : (() => {
                                    const slice = currentServerData.slice(selectedEpRange * EP_CHUNK, (selectedEpRange + 1) * EP_CHUNK);
                                    const rows: any[][] = [];
                                    for (let i = 0; i < slice.length; i += epCols) rows.push(slice.slice(i, i + epCols));
                                    return (
                                        <View style={[styles.episodeGrid, { width: contentWidth, flexDirection: 'column', flexWrap: 'nowrap' }]}>
                                            {rows.map((row, rowIdx) => (
                                                <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: EP_GAP }}>
                                                    {row.map((ep: any, colIdx: number) => {
                                                        const localUri = localUriByEp[ep.slug];
                                                        const playerHref = localUri
                                                            ? `/player/${movie.slug}?ep=${ep.slug}&server=${selectedServer}&localUri=${encodeURIComponent(localUri)}`
                                                            : `/player/${movie.slug}?ep=${ep.slug}&server=${selectedServer}`;
                                                        return (
                                                            <View
                                                                key={ep.slug}
                                                                style={[
                                                                    styles.epCardWrap,
                                                                    localUri && styles.epCardWrapOffline,
                                                                    { width: epCardWidth, marginRight: colIdx < row.length - 1 ? EP_GAP : 0 },
                                                                ]}
                                                            >
                                                                <Link href={playerHref as any} asChild>
                                                                    <Pressable style={styles.epCardInner}>
                                                                        <Text style={styles.epText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                                                                            {ep.name.toLowerCase().includes('tập') || ep.name.toLowerCase().includes('phần') ? ep.name : `Tập ${ep.name.padStart(2, '0')}`}
                                                                        </Text>
                                                                        {localUri && <Ionicons name="cloud-done" size={12} color={COLORS.accent} style={{ position: 'absolute', top: 4, right: 4 }} />}
                                                                    </Pressable>
                                                                </Link>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })()}
                            </View>
                        )}

                        {selectedTab === 'related' && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {relatedMovies.map(item => (
                                    <Link key={item.slug} href={`/movie/${item.slug}`} asChild>
                                        <Pressable style={{ width: '31%', marginBottom: 12 }}>
                                            <Image source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }} style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 8, marginBottom: 4 }} />
                                            <Text numberOfLines={1} style={{ color: 'white', fontSize: 12 }}>{item.name}</Text>
                                        </Pressable>
                                    </Link>
                                ))}
                            </View>
                        )}

                        {selectedTab === 'actors' && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {cast.length > 0 ? cast.map((actor: any) => {
                                    const photoUrl = actor.profile_url || actor.profile_path;
                                    const initials = actor.name
                                        ? actor.name.trim().split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                                        : '?';
                                    const colors = ['#1e3a6b', '#6b1212', '#2d1654', '#0f2030', '#5a1a00', '#1a3668'];
                                    const bgColor = colors[(actor.name?.charCodeAt(0) || 0) % colors.length];
                                    return (
                                        <Pressable
                                            key={actor.id || actor.name}
                                            style={({ pressed }) => ({ width: '31%', marginBottom: 12, opacity: pressed ? 0.75 : 1 })}
                                            onPress={() => actor.name && router.push(`/search?q=${encodeURIComponent(actor.name)}` as any)}
                                        >
                                            <View style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 8, marginBottom: 4, backgroundColor: '#222', overflow: 'hidden' }}>
                                                {photoUrl ? (
                                                    <Image
                                                        source={{ uri: photoUrl }}
                                                        style={{ width: '100%', height: '100%' }}
                                                        contentFit="cover"
                                                    />
                                                ) : (
                                                    <View style={{ flex: 1, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>{initials}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text numberOfLines={2} style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{actor.name}</Text>
                                            {actor.character && <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{actor.character}</Text>}
                                        </Pressable>
                                    );
                                }) : (
                                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', width: '100%', marginTop: 20, fontSize: 14 }}>
                                        Chưa có thông tin diễn viên.
                                    </Text>
                                )}
                            </View>
                        )}

                        {selectedTab === 'comments' && (
                            <View style={{ paddingBottom: 20 }}>
                                <CommentSection movieSlug={slugStr} />
                            </View>
                        )}

                        <View style={styles.synopsisBox}>
                            <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Nội dung phim</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 22 }}>
                                {movie.content?.replace(/<[^>]*>/g, '').trim()}
                            </Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Download sheet — iOS 26 liquid glass */}
            <Modal visible={showDownloadSheet} transparent animationType="slide">
                <Pressable style={styles.sheetOverlay} onPress={() => setShowDownloadSheet(false)}>
                    <Pressable style={styles.downloadSheet} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.downloadSheetHandle} />
                        <View style={styles.downloadSheetHeader}>
                            <Text style={styles.downloadSheetTitle}>Tải xuống</Text>
                            <Pressable onPress={() => setShowDownloadSheet(false)} style={styles.downloadSheetClose}>
                                <Ionicons name="close" size={24} color="white" />
                            </Pressable>
                        </View>
                        <Pressable
                            style={styles.downloadAllBtn}
                            onPress={() => setDownloadEpSlugs(new Set(currentServerData.map((e: any) => e.slug)))}
                        >
                            <Ionicons name="checkmark-done" size={20} color="#0B0D12" />
                            <Text style={styles.downloadAllBtnText}>Tải tất cả ({currentServerData.length} tập)</Text>
                        </Pressable>
                        <Text style={styles.downloadSheetSub}>Chọn tập cần tải:</Text>
                        <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                            <View style={styles.downloadEpList}>
                                {currentServerData.map((ep: any) => {
                                    const isSelected = downloadEpSlugs.has(ep.slug);
                                    return (
                                        <Pressable
                                            key={ep.slug}
                                            style={[styles.downloadEpRow, isSelected && styles.downloadEpRowActive]}
                                            onPress={() => {
                                                setDownloadEpSlugs((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(ep.slug)) next.delete(ep.slug);
                                                    else next.add(ep.slug);
                                                    return next;
                                                });
                                            }}
                                        >
                                            <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={22} color={isSelected ? COLORS.accent : 'rgba(255,255,255,0.5)'} />
                                            <Text style={styles.downloadEpText} numberOfLines={1}>{ep.name}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <Pressable
                            style={[styles.startDownloadBtn, downloadEpSlugs.size === 0 && styles.startDownloadBtnDisabled]}
                            disabled={downloadEpSlugs.size === 0}
                            onPress={async () => {
                                if (downloadEpSlugs.size === 0) return;
                                const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);
                                await addDownload({
                                    movieSlug: movie.slug,
                                    movieName: movie.name,
                                    posterUrl,
                                    serverIndex: selectedServer,
                                    episodes: currentServerData
                                        .filter((e: any) => downloadEpSlugs.has(e.slug))
                                        .map((e: any) => ({
                                            slug: e.slug,
                                            name: e.name,
                                            status: 'pending' as const,
                                            link_m3u8: e.link_m3u8 || undefined,
                                        })),
                                });
                                setShowDownloadSheet(false);
                                router.push('/(tabs)/download' as any);
                            }}
                        >
                            <Text style={styles.startDownloadBtnText}>Bắt đầu tải ({downloadEpSlugs.size} tập)</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    centerLoading: { flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center' },

    headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 100 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50 },
    headerTitle: { color: 'white', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    heroContent: { position: 'absolute', bottom: 20, left: 16, right: 16 },
    movieTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 6 },
    movieSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },

    chipRow: { flexDirection: 'row', gap: 8 },
    glassChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
    chipText: { color: 'white', fontSize: 12, fontWeight: '600' },

    bodyContent: { padding: 16 },

    actionRowFull: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    playBtnCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 22,
        backgroundColor: COLORS.accent,
        minWidth: 88,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
    },
    playBtnCompactDisabled: { opacity: 0.6 },
    playBtnCompactText: { color: '#0B0D12', fontSize: 14, fontWeight: '600' },
    actionIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },

    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 20,
    },
    downloadBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },

    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    downloadSheet: {
        backgroundColor: 'rgba(15,18,26,0.98)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    downloadSheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: 16 },
    downloadSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    downloadSheetTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
    downloadSheetClose: { padding: 4 },
    downloadAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(143,167,197,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.4)',
        marginBottom: 16,
    },
    downloadAllBtnText: { color: COLORS.accent, fontSize: 15, fontWeight: '600' },
    downloadSheetSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10 },
    downloadEpList: { gap: 6 },
    downloadEpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    downloadEpRowActive: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' },
    downloadEpText: { color: 'white', fontSize: 14, flex: 1 },
    startDownloadBtn: {
        marginTop: 16,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startDownloadBtnDisabled: { opacity: 0.5 },
    startDownloadBtnText: { color: '#0B0D12', fontSize: 16, fontWeight: '700' },

    selectorPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    selectorPillActive: { backgroundColor: 'rgba(143,167,197,0.12)', borderColor: 'rgba(143,167,197,0.4)' },
    selectorText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '500' },
    selectorTextActive: { color: COLORS.accent, fontWeight: '600' },

    // Segmented Tab — liquid glass
    tabContainerWrap: { position: 'relative', borderRadius: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    tabContainer: { flexDirection: 'row', borderRadius: 20, padding: 5, backgroundColor: 'transparent' },
    tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
    tabItemActive: { backgroundColor: 'rgba(255,255,255,0.10)' },
    tabText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },
    tabTextActive: { color: 'white', fontWeight: '600' },

    // Episode Grid — dark premium, iOS 26
    episodeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: EP_GAP,
        paddingTop: 8,
        paddingHorizontal: 0,
    },
    epCardWrap: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#111319',
        overflow: 'hidden',
        minHeight: 40,
    },
    epCardWrapOffline: { borderColor: '#F5C451', backgroundColor: 'rgba(245,196,81,0.10)' },
    epCardInner: {
        flex: 1,
        flexDirection: 'row',
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        gap: 4,
    },
    epText: {
        color: '#9CA3AF',
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 13,
        letterSpacing: 0.5,
        ...(Platform.OS === 'android' && { includeFontPadding: false }),
    },

    // Range chip — pill shape, cùng chiều cao, không cắt chữ
    rangeBtn: {
        height: 36,
        minWidth: 72,
        paddingHorizontal: 14,
        paddingVertical: 0,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rangeBtnActive: { backgroundColor: 'rgba(143,167,197,0.12)', borderColor: 'rgba(143,167,197,0.4)' },
    rangeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
    rangeBtnTextActive: { color: COLORS.accent, fontWeight: '600' },

    synopsisBox: { marginTop: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
});
