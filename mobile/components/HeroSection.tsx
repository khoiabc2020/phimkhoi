import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, Dimensions, StyleSheet, Pressable,
    TouchableOpacity, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie, getImageUrl, toggleFavorite as apiToggleFavorite } from '@/services/api';
import { COLORS } from '@/constants/theme';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { useAuth } from '@/context/auth';
import Carousel from 'react-native-reanimated-carousel';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';

const { width, height: screenHeight } = Dimensions.get('window');

// Portrait poster hero — tall card, info overlaid at bottom
// ~2:3 poster ratio, capped to ~65% of screen height so it looks right on all phones
const CAROUSEL_HEIGHT = Math.min(Math.floor(width * 1.36), Math.floor(screenHeight * 0.66));
const isTablet = width >= 768;

interface HeroSectionProps {
    movies: Movie[];
}

function getPosterUri(m: Movie): string {
    const anyM = m as any;
    if (anyM.tmdb_poster) return anyM.tmdb_poster;
    const tmdb = anyM.tmdbData;
    if (tmdb?.poster_path) {
        const p = String(tmdb.poster_path);
        return `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : `/${p}`}`;
    }
    return getImageUrl(m.poster_url || m.thumb_url);
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const insets = useSafeAreaInsets();
    const [activeIndex, setActiveIndex] = useState(0);
    const [favSlugs, setFavSlugs] = useState<Set<string>>(new Set());
    const { user, token, syncFavorites } = useAuth();

    // Smooth poster cross-fade on slide change
    const bgOpacity = useSharedValue(1);
    const [bgUris, setBgUris] = useState<[string, string]>(() => {
        const uri = movies?.length ? getPosterUri(movies[0]) : '';
        return [uri, uri];
    });
    const bgAnimStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

    // Prefetch first 4 poster images
    useEffect(() => {
        if (!movies?.length) return;
        movies.slice(0, 4).forEach(m => {
            const uri = getPosterUri(m);
            if (uri && (Image as any).prefetch) (Image as any).prefetch(uri);
        });
    }, [movies]);

    // Load favorite state
    useEffect(() => {
        if (!movies?.length) return;
        (async () => {
            const next = new Set<string>();
            if (user?.favorites?.length) {
                movies.forEach(m => {
                    if (user.favorites!.some((f: any) => (typeof f === 'string' ? f : f.slug) === m.slug))
                        next.add(m.slug);
                });
            } else {
                for (const m of movies) {
                    try { if (await isFavorite(m.slug)) next.add(m.slug); } catch (_) {}
                }
            }
            setFavSlugs(next);
        })();
    }, [movies, user]);

    const handleSnapToItem = useCallback((index: number) => {
        if (!movies[index]) return;
        setActiveIndex(prev => prev === index ? prev : index);
        const newUri = getPosterUri(movies[index]);
        let changed = false;
        setBgUris(prev => {
            if (prev[1] === newUri) return prev;
            changed = true;
            return [prev[1], newUri];
        });
        if (!changed) return;
        bgOpacity.value = 0;
        bgOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    }, [movies, bgOpacity]);

    const toggleFav = useCallback(async (movie: Movie) => {
        const slug = movie.slug;
        const currentlyFav = favSlugs.has(slug);
        setFavSlugs(prev => {
            const next = new Set(prev);
            currentlyFav ? next.delete(slug) : next.add(slug);
            return next;
        });
        try {
            if (user && token) {
                await apiToggleFavorite(movie, currentlyFav, token);
                syncFavorites?.();
            } else {
                if (!currentlyFav) await addFavorite({
                    movieId: (movie as any)._id || '', movieSlug: movie.slug,
                    movieName: movie.name, movieOriginName: movie.origin_name || '',
                    moviePoster: movie.poster_url || movie.thumb_url || '',
                    movieYear: movie.year || new Date().getFullYear(),
                    movieQuality: movie.quality || 'HD',
                    movieCategories: movie.category ? movie.category.map((c: any) => c.name) : [],
                    slug: movie.slug, name: movie.name,
                    poster_url: movie.poster_url, thumb_url: movie.thumb_url,
                });
                else await removeFavorite(slug);
            }
        } catch {
            setFavSlugs(prev => {
                const n = new Set(prev);
                currentlyFav ? n.add(slug) : n.delete(slug);
                return n;
            });
        }
    }, [favSlugs, user, token, syncFavorites]);

    const renderItem = useCallback(({ item, index }: { item: Movie; index: number }) => (
        <HeroSlide movie={item} index={index} isFav={favSlugs.has(item.slug)} onToggleFav={toggleFav} />
    ), [favSlugs, toggleFav]);

    if (!movies?.length) return null;
    const [, activeBgUri] = bgUris;

    return (
        <View style={styles.wrapper}>
            {/* Full-bleed blurred background (same poster, very blurred) */}
            <View style={StyleSheet.absoluteFill}>
                <Image source={{ uri: bgUris[0] }} style={StyleSheet.absoluteFill}
                    contentFit="cover" blurRadius={Platform.OS === 'ios' ? 30 : 20} cachePolicy="memory-disk" />
                <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]}>
                    <Image source={{ uri: activeBgUri }} style={StyleSheet.absoluteFill}
                        contentFit="cover" blurRadius={Platform.OS === 'ios' ? 30 : 20} cachePolicy="memory-disk" />
                </Animated.View>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,6,10,0.78)' }]} />
            </View>

            {/* Carousel — paddingTop pushes below header (insets.top + headerRow 50 + pillsRow 44 + gap 11) */}
            <View style={{ paddingTop: insets.top + 105, paddingHorizontal: 14 }}>
                <Carousel
                    width={width - 28}
                    height={CAROUSEL_HEIGHT}
                    data={movies}
                    loop={movies.length > 1}
                    enabled={movies.length > 1}
                    autoPlay={movies.length > 1}
                    autoPlayInterval={5500}
                    scrollAnimationDuration={500}
                    pagingEnabled
                    snapEnabled
                    windowSize={3}
                    panGestureHandlerProps={{ activeOffsetX: [-10, 10], failOffsetY: [-8, 8] }}
                    onSnapToItem={handleSnapToItem}
                    renderItem={renderItem}
                />
            </View>

            {/* Pagination dots */}
            {movies.length > 1 && (
                <View style={styles.dotsRow}>
                    {movies.map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                    ))}
                </View>
            )}

            {/* Fade bottom into page background */}
            <LinearGradient
                colors={['transparent', COLORS.bg0]}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20 }}
                pointerEvents="none"
            />
        </View>
    );
}

// ─── HeroSlide — portrait poster + overlay ───────────────────────────────────
const HeroSlide = React.memo(function HeroSlide({
    movie, index, isFav, onToggleFav,
}: { movie: Movie; index: number; isFav: boolean; onToggleFav: (m: Movie) => void }) {
    const router = useRouter();

    const posterUri = getPosterUri(movie);

    const rating = (() => {
        const anyM = movie as any;
        if (anyM.tmdb_vote) return Number(anyM.tmdb_vote).toFixed(1);
        if (anyM.tmdbData?.vote_average) return Number(anyM.tmdbData.vote_average).toFixed(1);
        return null;
    })();

    const categories = (movie.category || []).slice(0, 2).map((c: any) => c.name).join(' · ');

    return (
        <View style={styles.slideContainer}>
            {/* ── Full-width portrait poster image ── */}
            <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => router.push(`/movie/${movie.slug}` as any)}
            >
                <Image
                    source={{ uri: posterUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    priority={index === 0 ? 'high' : 'normal'}
                    cachePolicy="memory-disk"
                    transition={150}
                />

                {/* Bottom gradient — info readability */}
                <LinearGradient
                    colors={['transparent', 'rgba(5,6,10,0.25)', 'rgba(5,6,10,0.75)', 'rgba(5,6,10,0.97)']}
                    locations={[0.25, 0.52, 0.75, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </Pressable>

            {/* ── Top badges ── */}
            <View style={styles.topRow}>
                {index < 3 && (
                    <View style={styles.topBadge}>
                        <Text style={styles.topBadgeText}>TOP {index + 1}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }} />
                {movie.quality && (
                    <View style={styles.qualityBadge}>
                        <Text style={styles.qualityText}>{movie.quality}</Text>
                    </View>
                )}
                {rating && (
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={10} color="#FFB400" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                )}
            </View>

            {/* ── Info overlay at bottom ── */}
            <View style={styles.infoBlock} pointerEvents="box-none">
                <Text style={styles.title} numberOfLines={2}>{movie.name}</Text>
                {movie.origin_name && movie.origin_name !== movie.name && (
                    <Text style={styles.originName} numberOfLines={1}>{movie.origin_name}</Text>
                )}
                <Text style={styles.meta} numberOfLines={1}>
                    {[movie.year, categories].filter(Boolean).join('  ·  ')}
                </Text>

                {/* Action row */}
                <View style={styles.actionRow} pointerEvents="box-none">
                    {/* Watchlist */}
                    <TouchableOpacity style={styles.colBtn} onPress={() => onToggleFav(movie)} activeOpacity={0.8}>
                        <Ionicons
                            name={isFav ? 'checkmark-circle' : 'add-circle-outline'}
                            size={26}
                            color={isFav ? '#8FA7C5' : 'rgba(255,255,255,0.85)'}
                        />
                        <Text style={[styles.colBtnText, isFav && { color: '#8FA7C5' }]}>
                            {isFav ? 'Đã lưu' : 'Danh sách'}
                        </Text>
                    </TouchableOpacity>

                    {/* Play */}
                    <TouchableOpacity
                        style={styles.playBtn}
                        onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="play" size={20} color="#05060A" />
                        <Text style={styles.playBtnText}>Phát</Text>
                    </TouchableOpacity>

                    {/* Info */}
                    <TouchableOpacity
                        style={styles.colBtn}
                        onPress={() => router.push(`/movie/${movie.slug}` as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="information-circle-outline" size={26} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.colBtnText}>Thông tin</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        backgroundColor: COLORS.bg0,
        paddingBottom: 14,
        overflow: 'hidden',
    },

    // ─── Slide ─────────────────────────────────────────────
    slideContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0D1017',
        // Elevation / shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 18,
    },

    // ─── Top badge row ──────────────────────────────────────
    topRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    topBadge: {
        backgroundColor: '#8FA7C5',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    topBadgeText: { color: '#05060A', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    qualityBadge: {
        backgroundColor: 'rgba(5,6,10,0.65)',
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.35)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },
    qualityText: { color: '#c7d7ea', fontSize: 10, fontWeight: '800' },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(5,6,10,0.65)',
        borderWidth: 1,
        borderColor: 'rgba(255,180,0,0.3)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 4,
    },
    ratingText: { color: '#FFB400', fontSize: 10, fontWeight: '700' },

    // ─── Info overlay (bottom) ──────────────────────────────
    infoBlock: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.3,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        marginBottom: 4,
    },
    originName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    meta: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 16,
    },

    // ─── Actions ────────────────────────────────────────────
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    colBtn: {
        alignItems: 'center',
        gap: 5,
        width: 72,
    },
    colBtnText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '500',
    },
    playBtn: {
        flex: 1,
        maxWidth: 150,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#8FA7C5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        shadowColor: '#8FA7C5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    playBtnText: {
        color: '#05060A',
        fontWeight: '800',
        fontSize: 16,
    },

    // ─── Pagination dots ─────────────────────────────────────
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 5,
    },
    dot: { height: 5, borderRadius: 2.5 },
    dotActive: { width: 22, backgroundColor: '#8FA7C5' },
    dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.2)' },
});
