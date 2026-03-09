import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, Dimensions, StyleSheet, Pressable,
    TouchableOpacity, Platform
} from 'react-native';
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
const CAROUSEL_HEIGHT = width * 1.15;
const isTablet = width >= 768;

interface HeroSectionProps {
    movies: Movie[];
}

// Precomputed stable config outside component to avoid recreation each render
const PARALLAX_CONFIG = {
    parallaxScrollingScale: 0.88,
    parallaxScrollingOffset: 48,
};
const PAN_HANDLER_PROPS = { activeOffsetX: [-10, 10] as [number, number] };

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [favSlugs, setFavSlugs] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { user, token, syncFavorites } = useAuth();

    const tmdbImage = useCallback((path?: string, size: string = 'w780') => {
        if (!path) return '';
        const p = path.startsWith('/') ? path : `/${path}`;
        return `https://image.tmdb.org/t/p/${size}${p}`;
    }, []);

    const getBackdropUri = useCallback((m: Movie) => {
        const tmdb = (m as any).tmdbData;
        if (tmdb?.backdrop_path) return tmdbImage(tmdb.backdrop_path, 'w780');
        return getImageUrl(m.thumb_url || m.poster_url);
    }, [tmdbImage]);

    const getPosterUri = useCallback((m: Movie) => {
        const tmdb = (m as any).tmdbData;
        if (tmdb?.poster_path) return tmdbImage(tmdb.poster_path, 'w342');
        return getImageUrl(m.poster_url || m.thumb_url);
    }, [tmdbImage]);

    // Shared value for background cross-fade
    const bgOpacity = useSharedValue(1);
    // Keep previous and next backdrop URIs to cross-fade
    const [backdropUris, setBackdropUris] = useState<[string, string]>(() => {
        const uri = movies?.length ? getBackdropUri(movies[0]) : '';
        return [uri, uri];
    });

    // Prefetch top images to avoid "black flash" + reduce perceived jank
    useEffect(() => {
        if (!movies?.length) return;
        const top = movies.slice(0, 3);
        const uris = top
            .flatMap((m) => [getBackdropUri(m), getPosterUri(m)])
            .filter(Boolean);
        // expo-image supports prefetching for smoother first interactions
        // @ts-expect-error - static method exists on expo-image Image
        Image.prefetch?.(uris).catch?.(() => { });
    }, [movies, getBackdropUri, getPosterUri]);

    // Load favorites — prefer user.favorites from API (already in memory) to avoid slow AsyncStorage loop
    useEffect(() => {
        if (!movies?.length) return;
        (async () => {
            const next = new Set<string>();
            if (user?.favorites && user.favorites.length > 0) {
                // Fast path: use favorites array already available from the auth context
                movies.forEach(m => {
                    if (user.favorites!.some((f: any) => (typeof f === 'string' ? f : f.slug) === m.slug)) {
                        next.add(m.slug);
                    }
                });
                setFavSlugs(next);
            } else {
                // Slow path: query local storage only when API data is not available
                for (const m of movies) {
                    try {
                        if (await isFavorite(m.slug)) next.add(m.slug);
                    } catch (_) { }
                }
                setFavSlugs(next);
            }
        })();
    }, [movies, user]);

    // Smooth cross-fade when active slide changes
    const handleSnapToItem = useCallback((index: number) => {
        setActiveIndex(index);
        const newUri = getBackdropUri(movies[index]);
        // Fade out, swap URI, fade in
        bgOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }, () => {
            'worklet';
        });
        setTimeout(() => {
            setBackdropUris(([, prev]) => [prev, newUri]);
            bgOpacity.value = withTiming(1, { duration: 350, easing: Easing.in(Easing.quad) });
        }, 200);
    }, [movies, bgOpacity]);

    const bgAnimStyle = useAnimatedStyle(() => ({
        opacity: bgOpacity.value,
    }));

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
                    movieId: (movie as any)._id || '',
                    movieSlug: movie.slug,
                    movieName: movie.name,
                    movieOriginName: movie.origin_name || '',
                    moviePoster: movie.poster_url || movie.thumb_url || '',
                    movieYear: movie.year || new Date().getFullYear(),
                    movieQuality: movie.quality || 'HD',
                    movieCategories: movie.category ? movie.category.map((c: any) => c.name) : [],
                    slug: movie.slug,
                    name: movie.name,
                    poster_url: movie.poster_url,
                    thumb_url: movie.thumb_url,
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

    if (!movies?.length) return null;

    const [, activeBackdropUri] = backdropUris;

    return (
        <View style={styles.wrapper}>
            {/* Background — single Image that fades smoothly, no re-mount */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: activeBackdropUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    // Blur is expensive on Android; keep it subtle like Netflix
                    blurRadius={Platform.OS === 'ios' ? 8 : 0}
                    cachePolicy="memory-disk"
                    transition={180}
                />
                <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle, { backgroundColor: 'rgba(11,13,24,0.72)' }]} />
                <LinearGradient
                    colors={['transparent', '#0B0D18']}
                    style={[StyleSheet.absoluteFill, { top: '30%' }]}
                    pointerEvents="none"
                />
            </View>

            <View style={{ marginTop: 15 }}>
                <Carousel
                    width={width}
                    height={CAROUSEL_HEIGHT}
                    data={movies}
                    loop={true}
                    autoPlay={movies.length > 1}
                    autoPlayInterval={4500}
                    scrollAnimationDuration={380}
                    windowSize={5}
                    onSnapToItem={handleSnapToItem}
                    mode="parallax"
                    modeConfig={PARALLAX_CONFIG}
                    panGestureHandlerProps={PAN_HANDLER_PROPS}
                    renderItem={({ item, index }) => (
                        <HeroSlide
                            movie={item}
                            index={index}
                            isFav={favSlugs.has(item.slug)}
                            onToggleFav={() => toggleFav(item)}
                        />
                    )}
                />
            </View>

            {/* Pagination Dots */}
            {movies.length > 1 && (
                <View style={styles.dotsRow}>
                    {movies.map((_, i) => (
                        <View key={i} style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                    ))}
                </View>
            )}
        </View>
    );
}

// HeroSlide is pure — memoized so it never re-renders unless its own props change
const HeroSlide = React.memo(function HeroSlide({
    movie, index, isFav, onToggleFav,
}: { movie: Movie; index: number; isFav: boolean; onToggleFav: () => void }) {
    const router = useRouter();
    const posterUri = (() => {
        const tmdb = (movie as any).tmdbData;
        if (tmdb?.poster_path) {
            const p = String(tmdb.poster_path);
            return `https://image.tmdb.org/t/p/w342${p.startsWith('/') ? p : `/${p}`}`;
        }
        return getImageUrl(movie.poster_url || movie.thumb_url);
    })();
    const rating = (movie as any).tmdbData?.vote_average
        ? Number((movie as any).tmdbData.vote_average).toFixed(1)
        : null;

    return (
        <Pressable
            style={styles.slideContainer}
            onPress={() => router.push(`/movie/${movie.slug}` as any)}
        >
            <View style={styles.posterWrapper}>
                <Image
                    source={{ uri: posterUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    priority={index === 0 ? 'high' : 'normal'}
                    cachePolicy="memory-disk"
                    transition={180}
                />

                {/* Gradient Nền */}
                {isTablet ? (
                    <LinearGradient
                        colors={['rgba(11,13,24,0.9)', 'rgba(11,13,24,0.4)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                ) : (
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* Tags on top-right */}
                <View style={styles.badgesRow}>
                    {movie.quality && (
                        <View style={styles.badgeQuality}>
                            <Text style={styles.badgeQualityText}>{movie.quality}</Text>
                        </View>
                    )}
                    {rating && (
                        <View style={styles.badgeRating}>
                            <Ionicons name="star" size={12} color="#E6BF5C" />
                            <Text style={styles.badgeRatingText}>{rating}</Text>
                        </View>
                    )}
                </View>

                {/* Info block overlaid */}
                <View style={[styles.infoBlock, isTablet && styles.infoBlockTablet]}>
                    <Text style={[styles.title, isTablet && styles.titleTablet]} numberOfLines={2} adjustsFontSizeToFit>{movie.name}</Text>
                    <View style={[styles.metaRow, isTablet && styles.metaRowTablet]}>
                        {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
                        {movie.category?.slice(0, 2).map((c: any) => (
                            <Text key={c.id || c.name} style={styles.metaDot}>· {c.name}</Text>
                        ))}
                    </View>

                    <View style={[styles.actionRow, isTablet && styles.actionRowTablet]}>
                        <Pressable
                            style={[styles.playBtn, isTablet && { flex: 0, width: 140 }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                router.push(`/movie/${movie.slug}?autoPlay=true` as any);
                            }}
                        >
                            <Ionicons name="play" size={18} color="#0B0D12" />
                            <Text style={styles.playBtnText}>XEM</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.detailBtn, isTablet && { flex: 0, width: 140 }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                router.push(`/movie/${movie.slug}` as any);
                            }}
                        >
                            <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.detailBtnText}>CHI TIẾT</Text>
                        </Pressable>

                        <TouchableOpacity
                            style={[styles.circleBtn, isFav && styles.circleBtnFav]}
                            onPress={(e) => {
                                e.stopPropagation();
                                onToggleFav();
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? COLORS.accent : 'rgba(255,255,255,0.9)'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        backgroundColor: '#0B0D18',
        paddingBottom: 16,
        overflow: 'hidden',
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterWrapper: {
        width: '90%',
        height: '98%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 12,
    },
    badgesRow: {
        position: 'absolute',
        top: 14,
        right: 14,
        flexDirection: 'row',
        gap: 6,
        zIndex: 2,
    },
    badgeQuality: {
        backgroundColor: '#E6BF5C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeQualityText: {
        color: '#0B0D12',
        fontSize: 10,
        fontWeight: '800',
    },
    badgeRating: {
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    badgeRatingText: {
        color: '#E6BF5C',
        fontSize: 11,
        fontWeight: '700',
    },
    infoBlock: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 40,
        flexDirection: 'column',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 6,
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    metaText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    metaDot: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    playBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E6BF5C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#E6BF5C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    playBtnText: {
        color: '#0B0D12',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    detailBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    detailBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    circleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleBtnFav: {
        backgroundColor: 'rgba(244,200,74,0.15)',
        borderColor: 'rgba(244,200,74,0.4)',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: { height: 6, borderRadius: 3 },
    dotActive: { width: 22, backgroundColor: '#E6BF5C' },
    dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' },

    // Tablet Overrides
    infoBlockTablet: {
        width: '50%',
        left: 40,
        bottom: 40,
        alignItems: 'flex-start',
    },
    titleTablet: {
        textAlign: 'left',
        fontSize: 32,
    },
    metaRowTablet: {
        justifyContent: 'flex-start',
    },
    actionRowTablet: {
        justifyContent: 'flex-start',
    },
});
