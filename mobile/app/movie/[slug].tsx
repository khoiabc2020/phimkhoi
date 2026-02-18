import {
    View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions,
    StyleSheet, Platform, LayoutAnimation
} from 'react-native';
import { useLocalSearchParams, Stack, Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
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

// Tab options
const TABS = [
    { id: 'episodes', label: 'Tập phim' },
    { id: 'related', label: 'Đề xuất' },
    { id: 'actors', label: 'Diễn viên' },
    { id: 'gallery', label: 'Gallery' },
];

export default function MovieDetailScreen() {
    const { slug } = useLocalSearchParams();
    const router = useRouter();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fav, setFav] = useState(false);
    const [selectedTab, setSelectedTab] = useState('episodes');
    const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);

    const { user, token, syncFavorites } = useAuth();

    // Animation scroll value
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Check Favorite Status
    const checkFav = useCallback(async () => {
        if (!movie) return;
        if (user && user.favorites) {
            const isF = user.favorites.some((f: any) =>
                typeof f === 'string' ? f === movie.slug : f.slug === movie.slug
            );
            setFav(isF);
        } else {
            const isF = await isFavorite(movie._id);
            setFav(isF);
        }
    }, [movie, user]);

    useEffect(() => {
        checkFav();
    }, [checkFav]);

    // Fetch Data
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
                        getRelatedMovies(data.movie.category[0].slug).then((related: Movie[]) => {
                            setRelatedMovies(related.filter((m: Movie) => m.slug !== data.movie.slug));
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching detail", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    // Toggle Favorite logic
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
        } catch (e) { console.log(e); }
    };

    // Parallax Header Style
    const headerStyle = useAnimatedStyle(() => {
        return {
            height: interpolate(scrollY.value, [0, 300], [height * 0.6, height * 0.15], Extrapolation.CLAMP),
            transform: [
                { scale: interpolate(scrollY.value, [-300, 0], [1.5, 1], Extrapolation.CLAMP) },
            ],
        };
    });

    const headerBlurStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [0, 250], [0, 1], Extrapolation.CLAMP),
        };
    });

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
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const firstEpisode = episodes[0]?.server_data?.[0];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Floating Back Button */}
            <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            {/* Hero Background (Fixed) */}
            <Animated.View style={[styles.heroBackground, headerStyle]}>
                <Image
                    source={{ uri: posterUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={400}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(11,13,18,0.1)', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.6, 1]}
                />
                {/* Blur overlay when scrolling up */}
                <Animated.View style={[StyleSheet.absoluteFill, headerBlurStyle]}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                </Animated.View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: height * 0.45, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Content Overlay */}
                <View style={styles.contentContainer}>

                    {/* Main Info */}
                    <View style={styles.mainInfo}>
                        {/* Title */}
                        <Text style={styles.title} numberOfLines={2}>
                            {movie.name}
                        </Text>
                        <Text style={styles.subtitle}>
                            {movie.origin_name}
                        </Text>

                        {/* Meta Row */}
                        <View style={styles.metaRow}>
                            <View style={[styles.glassChip, { backgroundColor: 'rgba(244, 200, 74, 0.15)', borderColor: COLORS.accent }]}>
                                <Text style={[styles.chipText, { color: COLORS.accent }]}>FHD</Text>
                            </View>
                            <View style={styles.glassChip}>
                                <Text style={styles.chipText}>{movie.year}</Text>
                            </View>
                            <View style={styles.glassChip}>
                                <Text style={styles.chipText}>{movie.episode_current || 'N/A'}</Text>
                            </View>
                            <View style={styles.glassChip}>
                                <Ionicons name="star" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                                <Text style={styles.chipText}>{(movie.view || 0) > 1000 ? `${(movie.view / 1000).toFixed(1)}k` : movie.view}</Text>
                            </View>
                        </View>

                        {/* Watch Button */}
                        <Link href={firstEpisode ? `/player/${movie.slug}?ep=${firstEpisode.slug}` : '/'} asChild>
                            <Pressable style={({ pressed }) => [styles.watchBtn, pressed && { transform: [{ scale: 0.98 }] }]} disabled={!firstEpisode}>
                                <Ionicons name="play" size={24} color="black" />
                                <Text style={styles.watchBtnText}>Xem Ngay</Text>
                            </Pressable>
                        </Link>

                        {/* Action Row */}
                        <View style={styles.actionRow}>
                            <ActionBtn icon={fav ? "heart" : "heart-outline"} label="Yêu thích" active={fav} onPress={toggleFavorite} color={fav ? COLORS.accent : 'white'} />
                            <ActionBtn icon="add" label="Thêm vào" />
                            <ActionBtn icon="share-outline" label="Chia sẻ" />
                            <ActionBtn icon="star-outline" label="Đánh giá" />
                        </View>
                    </View>

                    {/* Tab Selection */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                        {TABS.map(tab => (
                            <Pressable
                                key={tab.id}
                                onPress={() => setSelectedTab(tab.id)}
                                style={[styles.tabItem, selectedTab === tab.id && styles.tabItemActive]}
                            >
                                <Text style={[styles.tabText, selectedTab === tab.id && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {/* EPISODES TAB */}
                        {selectedTab === 'episodes' && (
                            episodes.length > 0 ? (
                                <View>
                                    <View style={styles.serverHeader}>
                                        <Text style={styles.sectionTitle}>Phần 1</Text>
                                        <View style={styles.serverBadge}>
                                            <Text style={styles.serverText}>Vietsub #1</Text>
                                        </View>
                                    </View>
                                    <View style={styles.gridContainer}>
                                        {episodes.flatMap((s: any) => s.server_data).map((ep: any, index: number) => (
                                            <Link key={`${ep.slug}-${index}`} href={`/player/${movie.slug}?ep=${ep.slug}`} asChild>
                                                <Pressable style={({ pressed }) => [styles.epBtn, pressed && styles.epBtnPressed]}>
                                                    <Text style={styles.epBtnText}>{ep.name || index + 1}</Text>
                                                </Pressable>
                                            </Link>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>Chưa có tập phim nào.</Text>
                                </View>
                            )
                        )}

                        {/* RELATED TAB */}
                        {selectedTab === 'related' && (
                            <View style={styles.gridContainer}>
                                {relatedMovies.map(item => (
                                    <Link key={item.slug} href={`/movie/${item.slug}`} asChild>
                                        <Pressable style={styles.relatedCard}>
                                            <Image source={{ uri: getImageUrl(item.thumb_url) }} style={styles.relatedImg} contentFit="cover" />
                                            <Text numberOfLines={1} style={styles.relatedTitle}>{item.name}</Text>
                                        </Pressable>
                                    </Link>
                                ))}
                                {relatedMovies.length === 0 && (
                                    <View style={[styles.emptyState, { width: '100%' }]}>
                                        <Text style={styles.emptyText}>Chưa có phim đề xuất</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ACTORS/GALLERY PLACEHOLDER */}
                        {(selectedTab === 'actors' || selectedTab === 'gallery') && (
                            <View style={styles.emptyState}>
                                <Ionicons name="construct-outline" size={32} color="rgba(255,255,255,0.3)" />
                                <Text style={styles.emptyText}>Tính năng đang cập nhật</Text>
                            </View>
                        )}

                        {/* Description Card */}
                        <View style={styles.descCard}>
                            <Text style={styles.sectionTitle}>Nội dung</Text>
                            <Text style={styles.descText} numberOfLines={isFavorite ? 10 : 4}>
                                {movie.content?.replace(/<[^>]*>/g, '') || "Đang cập nhật nội dung..."}
                            </Text>
                        </View>
                    </View>

                </View>
            </Animated.ScrollView>
        </View>
    );
}

// Action Button Component
function ActionBtn({ icon, label, active, onPress, color = 'white' }: any) {
    return (
        <Pressable onPress={onPress} style={styles.actionBtn}>
            <View style={[styles.actionIconCircle, active && { backgroundColor: 'rgba(244, 200, 74, 0.1)' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg0,
    },
    centerLoading: {
        flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center'
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },
    contentContainer: {
        paddingHorizontal: 20,
    },
    mainInfo: {
        marginBottom: 24,
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    glassChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
    },
    watchBtn: {
        backgroundColor: COLORS.accent,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    watchBtnText: {
        color: 'black',
        fontSize: 18,
        fontWeight: '700',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    actionIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    actionLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
    },

    // Tabs
    tabScroll: {
        gap: 20,
        paddingBottom: 16,
        marginBottom: 10,
    },
    tabItem: {
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: COLORS.accent,
    },
    tabText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 15,
        fontWeight: '600',
    },
    tabTextActive: {
        color: COLORS.accent,
        fontWeight: '700',
    },
    tabContent: {
        paddingBottom: 40,
    },

    // Episode Grid
    serverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    serverBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    serverText: {
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: '700',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    epBtn: {
        width: (width - 60) / 3, // 3 columns
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    epBtnPressed: {
        backgroundColor: COLORS.accent,
    },
    epBtnText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
    },

    // Related
    relatedCard: {
        width: (width - 50) / 3,
        marginBottom: 16,
    },
    relatedImg: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 12,
        marginBottom: 8,
    },
    relatedTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Description
    descCard: {
        marginTop: 30,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    descText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 22,
        marginTop: 10,
    },

    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        marginTop: 8,
    }
});
