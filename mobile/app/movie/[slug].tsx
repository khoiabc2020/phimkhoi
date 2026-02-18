import {
    View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions,
    StyleSheet, Platform
} from 'react-native';
import { useLocalSearchParams, Stack, Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
    interpolate, Extrapolation
} from 'react-native-reanimated';

import { getMovieDetail, getImageUrl, getRelatedMovies, Movie } from '@/services/api';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { COLORS, SPACING, RADIUS, BLUR } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Tab options (Segmented Control)
const TABS = [
    { id: 'episodes', label: 'Tập phim' },
    { id: 'related', label: 'Đề xuất' },
    { id: 'actors', label: 'Diễn viên' },
];

export default function MovieDetailScreen() {
    const { slug } = useLocalSearchParams();
    const router = useRouter();

    // Data State
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    // UI State
    const [selectedTab, setSelectedTab] = useState('episodes');
    const [selectedServer, setSelectedServer] = useState(0); // Index of server
    const [selectedAudio, setSelectedAudio] = useState<'vietsub' | 'thuyet-minh' | 'long-tieng'>('vietsub');

    const { user, token, syncFavorites } = useAuth();

    // Animation scroll value
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Fetch Logic
    useEffect(() => {
        const fetchDetail = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await getMovieDetail(slug as string);
                if (data && data.movie) {
                    setMovie(data.movie);
                    setEpisodes(data.episodes || []);
                    if (data.movie.category?.[0]?.slug) {
                        getRelatedMovies(data.movie.category[0].slug).then(res =>
                            setRelatedMovies(res.filter((m: Movie) => m.slug !== data.movie.slug))
                        );
                    }
                    // Detection Logic for Audio Types (Mock logic or based on server name)
                    // Realistically, you'd parse episodes names or server names to auto-select
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDetail();
    }, [slug]);

    // Favorite Logic
    const checkFav = useCallback(async () => {
        if (!movie) return;
        if (user?.favorites) {
            setFav(user.favorites.some((f: any) => (typeof f === 'string' ? f : f.slug) === movie.slug));
        } else {
            setFav(await isFavorite(movie._id));
        }
    }, [movie, user]);
    useEffect(() => { checkFav(); }, [checkFav]);

    const toggleFavorite = async () => {
        if (!movie) return;
        try {
            if (user && token) {
                const method = fav ? 'DELETE' : 'POST';
                await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
                    method,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ slug: movie.slug })
                });
                await syncFavorites();
            } else {
                if (fav) await removeFavorite(movie._id);
                else await addFavorite({ _id: movie._id, slug: movie.slug, name: movie.name, poster_url: movie.poster_url, thumb_url: movie.thumb_url });
            }
            setFav(!fav);
        } catch (e) { }
    };

    // HEADER ANIMATIONS
    const headerOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [100, 250], [0, 1], Extrapolation.CLAMP)
    }));

    const titleScale = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(scrollY.value, [0, 200], [1, 0.8], Extrapolation.CLAMP) }],
        opacity: interpolate(scrollY.value, [0, 200], [1, 0], Extrapolation.CLAMP)
    }));

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

    // Format Metadata for Play Button
    const playButtonText = `Xem ngay • ${serverName}`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Floating Header */}
            <View style={styles.headerContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, headerOpacity]}>
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 13, 18, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]} />
                    )}
                    {Platform.OS === 'ios' && <View style={styles.headerBorder} />}
                </Animated.View>

                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="white" />
                        </Pressable>
                        <Animated.Text style={[styles.headerTitle, headerOpacity]} numberOfLines={1}>
                            {movie.name}
                        </Animated.Text>
                        <Pressable onPress={() => { /* Share */ }} style={styles.iconBtn}>
                            <Ionicons name="share-outline" size={22} color="white" />
                        </Pressable>
                    </View>
                </SafeAreaView>
            </View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* HERO SECTION (45% Height) */}
                <View style={{ height: height * 0.45, width: '100%' }}>
                    <Image
                        source={{ uri: posterUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                    />
                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', COLORS.bg0]}
                        style={StyleSheet.absoluteFill}
                        locations={[0.3, 1]}
                    />

                    {/* Bottom Content of Hero */}
                    <View style={styles.heroContent}>
                        <Animated.View style={titleScale}>
                            <Text style={styles.movieTitle} numberOfLines={2}>{movie.name}</Text>
                            <Text style={styles.movieSubtitle}>{movie.origin_name} • {movie.year}</Text>
                        </Animated.View>

                        {/* Meta Chips Glass */}
                        <View style={styles.chipRow}>
                            <View style={styles.glassChip}>
                                <Text style={styles.chipText}>{movie.quality || 'FHD'}</Text>
                            </View>
                            <View style={[styles.glassChip, { borderColor: COLORS.accent }]}>
                                <Text style={[styles.chipText, { color: COLORS.accent }]}>
                                    {movie.lang || 'Vietsub'}
                                </Text>
                            </View>
                            <View style={styles.glassChip}>
                                <Ionicons name="star" size={10} color={COLORS.accent} style={{ marginRight: 4 }} />
                                <Text style={styles.chipText}>{(movie.view || 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* BODY CONTENT */}
                <View style={styles.bodyContent}>

                    {/* 1. PLAY SECTION & ACTIONS */}
                    <View style={styles.playSection}>
                        <Link href={firstEpisode ? `/player/${movie.slug}?ep=${firstEpisode.slug}` : '/'} asChild>
                            <Pressable style={styles.playBtn} disabled={!firstEpisode}>
                                <LinearGradient
                                    colors={[COLORS.accent, '#d97706']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <Ionicons name="play" size={20} color="black" />
                                <Text style={styles.playBtnText}>{playButtonText}</Text>
                            </Pressable>
                        </Link>

                        <View style={styles.actionRow}>
                            <ActionIcon icon={fav ? "heart" : "heart-outline"} active={fav} onPress={toggleFavorite} />
                            <ActionIcon icon="add" />
                            <ActionIcon icon="download-outline" />
                        </View>
                    </View>

                    {/* 2. SERVER & AUDIO SELECTOR */}
                    {(episodes.length > 1) && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
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

                    {/* 3. SEGMENTED TABS */}
                    <View style={styles.tabContainer}>
                        {TABS.map(tab => (
                            <Pressable
                                key={tab.id}
                                style={[styles.tabPill, selectedTab === tab.id && styles.tabPillActive]}
                                onPress={() => setSelectedTab(tab.id)}
                            >
                                <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* 4. CONTENT AREA */}
                    <View style={styles.contentArea}>
                        {selectedTab === 'episodes' && (
                            <View>
                                <Text style={styles.sectionHeader}>Danh sách tập</Text>
                                <View style={styles.episodeGrid}>
                                    {currentServerData.map((ep: any, idx: number) => (
                                        <Link key={idx} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                            <Pressable style={styles.epCard}>
                                                <Text style={styles.epText}>{ep.name}</Text>
                                            </Pressable>
                                        </Link>
                                    ))}
                                </View>
                                {currentServerData.length === 0 && <Text style={styles.emptyText}>Đang cập nhật...</Text>}
                            </View>
                        )}

                        {selectedTab === 'related' && (
                            <View style={styles.episodeGrid}>
                                {relatedMovies.length > 0 ? relatedMovies.map(item => (
                                    <Link key={item.slug} href={`/movie/${item.slug}`} asChild>
                                        <Pressable style={styles.relatedCard}>
                                            <Image source={{ uri: getImageUrl(item.thumb_url) }} style={styles.relatedImg} />
                                            <Text numberOfLines={1} style={styles.relatedTitle}>{item.name}</Text>
                                        </Pressable>
                                    </Link>
                                )) : (
                                    <Text style={styles.emptyText}>Chưa có đề xuất</Text>
                                )}
                            </View>
                        )}

                        {/* Description at bottom */}
                        <View style={styles.descBox}>
                            <Text style={styles.descTitle}>Nội dung</Text>
                            <Text style={styles.descText} numberOfLines={isFavorite ? 100 : 4}>
                                {movie.content?.replace(/<[^>]*>/g, '').trim()}
                            </Text>
                        </View>
                    </View>

                </View>
            </Animated.ScrollView>
        </View>
    );
}

function ActionIcon({ icon, active, onPress }: any) {
    return (
        <Pressable onPress={onPress} style={styles.actionIconBtn}>
            <Ionicons name={icon} size={22} color={active ? COLORS.accent : 'rgba(255,255,255,0.8)'} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    centerLoading: { flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center' },

    // Header
    headerContainer: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    },
    headerRow: {
        height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
    },
    headerTitle: {
        color: 'white', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', opacity: 0
    },
    headerBorder: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.1)'
    },
    iconBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
    },

    // Hero
    heroContent: {
        position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 20,
    },
    movieTitle: {
        color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4
    },
    movieSubtitle: {
        color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16, fontWeight: '500'
    },
    chipRow: {
        flexDirection: 'row', gap: 8,
    },
    glassChip: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    chipText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },

    // Body
    bodyContent: { paddingHorizontal: 16, marginTop: 10 },

    // Play Section
    playSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    playBtn: {
        flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, overflow: 'hidden'
    },
    playBtnText: { color: 'black', fontSize: 15, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionIconBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },

    // Selectors
    selectorScroll: { flexGrow: 0, marginBottom: 16 },
    selectorPill: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    selectorPillActive: { backgroundColor: 'rgba(244, 200, 74, 0.15)', borderColor: COLORS.accent },
    selectorText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
    selectorTextActive: { color: COLORS.accent, fontWeight: '700' },

    // Tabs
    tabContainer: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 22,
        marginBottom: 20
    },
    tabPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 18 },
    tabPillActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: 'white', fontWeight: '700' },

    // Content Area
    contentArea: {},
    sectionHeader: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 12 },
    episodeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    epCard: {
        width: '18%', aspectRatio: 1.5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
    },
    epText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
    emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 },

    // Related
    relatedCard: { width: '31%', marginBottom: 12 },
    relatedImg: { width: '100%', aspectRatio: 2 / 3, borderRadius: 12, marginBottom: 6 },
    relatedTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },

    // Desc
    descBox: { marginTop: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16 },
    descTitle: { color: 'white', fontSize: 14, fontWeight: '700', marginBottom: 8 },
    descText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 },
});
