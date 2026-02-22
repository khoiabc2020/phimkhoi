import {
    View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions,
    StyleSheet, Platform, Animated, StatusBar as RNStatusBar
} from 'react-native';
import { useLocalSearchParams, Stack, Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMovieDetail, getImageUrl, getRelatedMovies, Movie, getTMDBRating, getTMDBCast, toggleFavorite as apiToggleFavorite } from '@/services/api';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { addToWatchList, removeFromWatchList, isInWatchList } from '@/lib/watchList';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { COLORS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Responsive episode columns
const EP_COLS = width < 380 ? 3 : width < 430 ? 4 : 5;
const EP_GAP = 10;
const EP_PADDING = 16;
const EP_CARD_WIDTH = Math.floor((width - EP_PADDING * 2 - EP_GAP * (EP_COLS - 1)) / EP_COLS);

// Tab options
const TABS = [
    { id: 'episodes', label: 'Tập phim' },
    { id: 'related', label: 'Đề xuất' },
    { id: 'actors', label: 'Diễn viên' },
];

export default function MovieDetailScreen() {
    const { slug, autoPlay } = useLocalSearchParams();
    const router = useRouter();

    // Data State
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [inWatchList, setInWatchList] = useState(false);
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    // UI State
    const [selectedTab, setSelectedTab] = useState('episodes');
    const [selectedServer, setSelectedServer] = useState(0);
    const [rating, setRating] = useState<number | null>(null);
    const [cast, setCast] = useState<any[]>([]);
    const [selectedEpRange, setSelectedEpRange] = useState(0); // 0 = first group of 50
    const EP_CHUNK = 50; // Episodes per page

    const { user, token, syncFavorites, syncWatchList } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMovieDetail(slug as string);
            if (data?.movie) {
                setMovie(data.movie);
                setEpisodes(data.episodes || []);
                const related = await getRelatedMovies(data.movie.category?.[0]?.slug || '');
                setRelatedMovies(related);

                const tmdbRating = await getTMDBRating(data.movie.name, data.movie.year);
                if (tmdbRating) setRating(tmdbRating);
                const tmdbCast = await getTMDBCast(data.movie.name, data.movie.year);
                if (tmdbCast) setCast(tmdbCast.slice(0, 15));

                // Handle AutoPlay flag immediately after data fetches
                const isAutoPlay = Array.isArray(autoPlay) ? autoPlay[0] === 'true' : autoPlay === 'true';
                if (isAutoPlay && data.episodes?.[selectedServer]?.server_data?.[0]) {
                    const firstEp = data.episodes[selectedServer].server_data[0].slug;
                    router.replace(`/player/${data.movie.slug}?ep=${firstEp}&server=${selectedServer}` as any);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [slug, autoPlay, selectedServer, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                    await addFavorite({ slug: movie.slug, name: movie.name, poster_url: movie.poster_url, thumb_url: movie.thumb_url });
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
                setInWatchList(await isInWatchList(movie.slug));
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
                    await addToWatchList({ slug: movie.slug, name: movie.name, poster_url: movie.poster_url, thumb_url: movie.thumb_url });
                } else {
                    await removeFromWatchList(movie.slug);
                }
            }
        } catch (e) {
            setInWatchList(!newState); // Revert
            console.error(e);
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

    if (!movie) return null;

    const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const currentServerData = episodes[selectedServer]?.server_data || [];
    const firstEpisode = currentServerData[0];
    const serverName = episodes[selectedServer]?.server_name || `Server ${selectedServer + 1}`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* HEADER */}
            <View style={styles.headerContainer}>
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                    <View style={styles.headerRow}>
                        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </Pressable>
                        <Text style={styles.headerTitle} numberOfLines={1}>{movie.name}</Text>
                        <Pressable style={styles.iconBtn}>
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
                <View style={{ height: height * 0.45, width: '100%' }}>
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
                            {rating !== null && (
                                <View style={[styles.glassChip, { backgroundColor: '#fbbf24', borderColor: '#fbbf24' }]}>
                                    <Text style={[styles.chipText, { color: 'black', fontWeight: 'bold' }]}>IMDb {rating.toFixed(1)}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* BODY */}
                <View style={styles.bodyContent}>
                    {/* ACTION BUTTONS */}
                    <View style={styles.playSection}>
                        <Pressable
                            style={styles.playBtn}
                            disabled={!firstEpisode}
                            onPress={() => {
                                if (firstEpisode) {
                                    router.push(`/player/${movie.slug}?ep=${firstEpisode.slug}&server=${selectedServer}`);
                                }
                            }}
                        >
                            <Ionicons name="play" size={20} color="#0B0D12" />
                            <Text style={styles.playBtnText}>{firstEpisode ? 'Xem Phim' : 'Đang cập nhật'}</Text>
                        </Pressable>

                        <View style={styles.actionRow}>
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
                                <Ionicons name={inWatchList ? "checkmark-circle" : "add-circle-outline"} size={22} color={inWatchList ? "white" : "white"} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Server Selector */}
                    {episodes.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            {episodes.map((server, idx) => (
                                <Pressable
                                    key={idx}
                                    style={[styles.selectorPill, selectedServer === idx && styles.selectorPillActive]}
                                    onPress={() => setSelectedServer(idx)}
                                >
                                    <Text style={[styles.selectorText, selectedServer === idx && styles.selectorTextActive]}>
                                        {server.server_name}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}

                    {/* TABS */}
                    <View style={styles.tabContainer}>
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

                    {/* CONTENT */}
                    <View style={{ minHeight: 300 }}>
                        {selectedTab === 'episodes' && (
                            <View>
                                {/* Range Picker - only show if many episodes */}
                                {currentServerData.length > EP_CHUNK && (() => {
                                    const totalGroups = Math.ceil(currentServerData.length / EP_CHUNK);
                                    return (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
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
                                                        <Text style={[
                                                            styles.rangeBtnText,
                                                            selectedEpRange === i && styles.rangeBtnTextActive
                                                        ]}>
                                                            {from}–{to}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </ScrollView>
                                    );
                                })()}

                                {/* Episode Grid (paginated) */}
                                <View style={styles.episodeGrid}>
                                    {currentServerData
                                        .slice(selectedEpRange * EP_CHUNK, (selectedEpRange + 1) * EP_CHUNK)
                                        .map((ep: any, idx: number) => (
                                            <Link key={idx} href={`/player/${movie.slug}?ep=${ep.slug}&server=${selectedServer}`} asChild>
                                                <Pressable style={styles.epCard}>
                                                    <Text style={styles.epText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{ep.name.replace('Tập ', '')}</Text>
                                                </Pressable>
                                            </Link>
                                        ))}
                                    {currentServerData.length === 0 && <Text style={{ color: 'gray', textAlign: 'center', width: '100%', marginTop: 20 }}>Chưa có tập phim nào.</Text>}
                                </View>
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
                                {cast.map((actor: any) => (
                                    <View key={actor.id} style={{ width: '31%', marginBottom: 12 }}>
                                        <Image
                                            source={{ uri: actor.profile_path || 'https://ui-avatars.com/api/?name=' + actor.name }}
                                            style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 8, marginBottom: 4, backgroundColor: '#333' }}
                                            contentFit="cover"
                                        />
                                        <Text numberOfLines={1} style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{actor.name}</Text>
                                        <Text numberOfLines={1} style={{ color: 'gray', fontSize: 10 }}>{actor.character}</Text>
                                    </View>
                                ))}
                                {cast.length === 0 && <Text style={{ color: 'gray', textAlign: 'center', width: '100%', marginTop: 20 }}>Đang cập nhật diễn viên...</Text>}
                            </View>
                        )}

                        {/* Always show content below */}
                        <View style={{ marginTop: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Nội dung phim</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 22 }}>
                                {movie.content?.replace(/<[^>]*>/g, '').trim()}
                            </Text>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    centerLoading: { flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center' },

    headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 100 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50 },
    headerTitle: { color: 'white', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },

    heroContent: { position: 'absolute', bottom: 20, left: 16, right: 16 },
    movieTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 6 },
    movieSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },

    chipRow: { flexDirection: 'row', gap: 8 },
    glassChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    chipText: { color: 'white', fontSize: 12, fontWeight: '600' },

    bodyContent: { padding: 16 },

    playSection: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    playBtn: { flex: 1, height: 46, borderRadius: 24, backgroundColor: '#F4C84A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
    playBtnText: { color: '#0B0D12', fontSize: 15, fontWeight: '500' },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionIconBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    selectorPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    selectorPillActive: { backgroundColor: 'rgba(244,200,74,0.12)', borderColor: 'rgba(244,200,74,0.4)' },
    selectorText: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '500' },
    selectorTextActive: { color: '#F4C84A', fontWeight: '600' },

    // Segmented Tab — iOS 26 style
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 5, marginBottom: 20 },
    tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
    tabItemActive: { backgroundColor: 'rgba(255,255,255,0.10)' },
    tabText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },
    tabTextActive: { color: 'white', fontWeight: '600' },

    // Episode Grid — responsive (3/4/5 cột theo width màn hình)
    episodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: EP_GAP, paddingHorizontal: EP_PADDING, paddingTop: 4 },
    epCard: {
        width: EP_CARD_WIDTH,
        height: 46,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    epText: { color: 'rgba(255,255,255,0.85)', fontWeight: '500', textAlign: 'center', fontSize: 14 },

    // Range chip — pill shape
    rangeBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    rangeBtnActive: { backgroundColor: 'rgba(244,200,74,0.12)', borderColor: 'rgba(244,200,74,0.4)' },
    rangeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
    rangeBtnTextActive: { color: '#F4C84A', fontWeight: '600' },
});
