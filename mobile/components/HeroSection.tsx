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
const CAROUSEL_HEIGHT = Math.min(width * 0.82, 360); // Compact hero — max 360dp, ~0.82 aspect ratio
const isTablet = width >= 768;

interface HeroSectionProps {
    movies: Movie[];
}

const HERO_HORIZONTAL_PADDING = 12;

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
        const anyM = m as any;
        if (anyM.tmdb_backdrop) return anyM.tmdb_backdrop;
        const tmdb = anyM.tmdbData;
        if (tmdb?.backdrop_path) return tmdbImage(tmdb.backdrop_path, 'w780');
        return getImageUrl(m.thumb_url || m.poster_url);
    }, [tmdbImage]);

    const getPosterUri = useCallback((m: Movie) => {
        const anyM = m as any;
        if (anyM.tmdb_poster) return anyM.tmdb_poster;
        const tmdb = anyM.tmdbData;
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
        // Prefetch instead of clearing caches to avoid unnecessary image re-downloads.
        uris.forEach((uri) => {
            if ((Image as any).prefetch) {
                (Image as any).prefetch(uri);
            }
        });
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
        if (!movies[index]) return;
        setActiveIndex((prev) => (prev === index ? prev : index));
        const newUri = getBackdropUri(movies[index]);
        // Avoid state churn if the uri does not actually change.
        let changed = false;
        setBackdropUris((prev) => {
            const current = prev[1];
            if (current === newUri) return prev;
            changed = true;
            return [current, newUri];
        });
        if (!changed) return;
        // Swap URI first, then fade in the new layer to avoid black flash.
        // eslint-disable-next-line react-hooks/immutability
        bgOpacity.value = 0;
        bgOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    }, [movies, bgOpacity, getBackdropUri]);

    const bgAnimStyle = useAnimatedStyle(() => ({
        opacity: bgOpacity.value,
    }));

    // Prefetch active + neighbor slides to keep swipe smooth.
    useEffect(() => {
        if (!movies?.length) return;
        const idxs = [activeIndex, (activeIndex + 1) % movies.length, (activeIndex - 1 + movies.length) % movies.length];
        const uris = idxs.flatMap((i) => {
            const m = movies[i];
            return [getBackdropUri(m), getPosterUri(m)];
        }).filter(Boolean);
        uris.forEach((uri) => {
            if ((Image as any).prefetch) {
                (Image as any).prefetch(uri);
            }
        });
    }, [activeIndex, movies, getBackdropUri, getPosterUri]);

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

    const renderHeroItem = useCallback(({ item, index }: { item: Movie; index: number }) => (
        <HeroSlide
            movie={item}
            index={index}
            isFav={favSlugs.has(item.slug)}
            onToggleFav={toggleFav}
        />
    ), [favSlugs, toggleFav]);

    if (!movies?.length) return null;

    const [, activeBackdropUri] = backdropUris;

    return (
        <View style={styles.wrapper}>
            {/* Background — dual layer cross-fade for smoother transitions */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: backdropUris[0] }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    blurRadius={Platform.OS === 'ios' ? 4 : 0}
                    cachePolicy="memory-disk"
                    transition={80}
                />
                <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]}>
                    <Image
                        source={{ uri: activeBackdropUri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        blurRadius={Platform.OS === 'ios' ? 4 : 0}
                        cachePolicy="memory-disk"
                        transition={80}
                    />
                </Animated.View>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,6,10,0.65)' }]} />
                <LinearGradient
                    colors={['transparent', 'rgba(5,6,10,0.85)', '#05060A']}
                    locations={[0, 0.65, 1]}
                    style={[StyleSheet.absoluteFill, { top: '25%' }]}
                    pointerEvents="none"
                />
            </View>

            {/* Push content down below safe area/header, but leave background full bleed */}
            <View style={{ paddingTop: 90 }}>
                <Carousel
                    width={width}
                    height={CAROUSEL_HEIGHT}
                    data={movies}
                    loop={true}
                    enabled={movies.length > 1}
                    autoPlay={movies.length > 1}
                    autoPlayInterval={5200}
                    scrollAnimationDuration={520}
                    pagingEnabled={true}
                    snapEnabled={true}
                    windowSize={3}
                    panGestureHandlerProps={{
                        activeOffsetX: [-12, 12],
                        failOffsetY: [-10, 10],
                    }}
                    onSnapToItem={handleSnapToItem}
                    renderItem={renderHeroItem}
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
}: { movie: Movie; index: number; isFav: boolean; onToggleFav: (movie: Movie) => void }) {
    const router = useRouter();
    const posterUri = (() => {
        const anyM = movie as any;
        if (anyM.tmdb_poster) return anyM.tmdb_poster;
        const tmdb = anyM.tmdbData;
        if (tmdb?.poster_path) {
            const p = String(tmdb.poster_path);
            return `https://image.tmdb.org/t/p/w342${p.startsWith('/') ? p : `/${p}`}`;
        }
        return getImageUrl(movie.poster_url || movie.thumb_url);
    })();
    const backdropUri = (() => {
        const anyM = movie as any;
        if (anyM.tmdb_backdrop) return anyM.tmdb_backdrop;
        const tmdb = anyM.tmdbData;
        if (tmdb?.backdrop_path) {
            const p = String(tmdb.backdrop_path);
            return `https://image.tmdb.org/t/p/w780${p.startsWith('/') ? p : `/${p}`}`;
        }
        return getImageUrl(movie.thumb_url || movie.poster_url);
    })();
    const rating = (() => {
        const anyM = movie as any;
        if (anyM.tmdb_vote) return Number(anyM.tmdb_vote).toFixed(1);
        if (anyM.tmdbData?.vote_average) return Number(anyM.tmdbData.vote_average).toFixed(1);
        return null;
    })();

    return (
        <View style={styles.slideContainer}>
            <View style={styles.posterWrapper}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => router.push(`/movie/${movie.slug}` as any)}
                >
                    <Image
                        source={{ uri: backdropUri || posterUri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        priority={index === 0 ? 'high' : 'normal'}
                        cachePolicy="memory-disk"
                        transition={120}
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
                                <Ionicons name="star" size={12} color="#E50914" />
                                <Text style={styles.badgeRatingText}>{rating}</Text>
                            </View>
                        )}
                    </View>

                </Pressable>

                {/* Info block overlaid */}
                <View style={[styles.infoBlock, isTablet && styles.infoBlockTablet]} pointerEvents="box-none">
                    {/* Top 10 Badge for the first 3 items */}
                    {index < 3 && (
                        <View style={styles.top10Badge}>
                            <View style={styles.top10Square}>
                                <Text style={styles.top10SquareText}>TOP</Text>
                                <Text style={styles.top10SquareNumber}>10</Text>
                            </View>
                            <Text style={styles.top10Text}>Phim phổ biến hôm nay</Text>
                        </View>
                    )}

                    <Text style={[styles.title, isTablet && styles.titleTablet]} numberOfLines={2}>{movie.name}</Text>
                    <View style={[styles.metaRow, isTablet && styles.metaRowTablet]}>
                        {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
                        {movie.category?.slice(0, 3).map((c: any) => (
                            <Text key={c.id || c.name} style={styles.metaDot}>· {c.name}</Text>
                        ))}
                    </View>

                    <View style={[styles.actionRow, isTablet && styles.actionRowTablet]} pointerEvents="box-none">
                        <TouchableOpacity
                            style={styles.colBtn}
                            onPress={() => onToggleFav(movie)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={isFav ? 'checkmark' : 'add'} size={28} color="#FFFFFF" />
                            <Text style={styles.colBtnText}>Danh sách</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.playBtn, isTablet && { flex: 0, width: 160 }]}
                            onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="play" size={24} color="#d8e3f2" />
                            <Text style={styles.playBtnText}>Phát</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.colBtn}
                            onPress={() => router.push(`/movie/${movie.slug}` as any)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="information-circle-outline" size={28} color="#FFFFFF" />
                            <Text style={styles.colBtnText}>Thông tin</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        backgroundColor: COLORS.bg0,
        paddingBottom: 16,
        overflow: 'hidden',
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: HERO_HORIZONTAL_PADDING,
        paddingBottom: 2,
    },
    posterWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#0B0D18',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius: 22,
        elevation: 14,
    },
    badgesRow: {
        position: 'absolute',
        top: 16,
        right: 12,
        flexDirection: 'row',
        gap: 6,
        zIndex: 2,
    },
    badgeQuality: {
        backgroundColor: '#263243',
        borderWidth: 1,
        borderColor: '#33455F',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeQualityText: {
        color: '#d8e3f2',
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
        color: '#c7d7ea',
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
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 4,
    },
    colBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        gap: 4,
    },
    colBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    playBtn: {
        flex: 1,
        maxWidth: 160,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#263243',
        borderWidth: 1,
        borderColor: '#33455F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    playBtnText: {
        color: '#d8e3f2',
        fontWeight: 'bold',
        fontSize: 16,
    },
    top10Badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        gap: 8,
    },
    top10Square: {
        backgroundColor: '#263243',
        borderWidth: 1,
        borderColor: '#33455F',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    top10SquareText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    top10SquareNumber: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: -2 },
    top10Text: {
        color: '#d8e3f2',
        fontWeight: 'bold',
        fontSize: 13,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: { height: 6, borderRadius: 3 },
    dotActive: { width: 22, backgroundColor: '#E50914' },
    dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' },

    // Tablet Overrides
    infoBlockTablet: {
        width: '56%',
        left: 30,
        bottom: 30,
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
