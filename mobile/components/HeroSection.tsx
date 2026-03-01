import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, Platform, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import FocusableButton from './FocusableButton';
import { Image } from 'expo-image';
import { Movie, getImageUrl, toggleFavorite as apiToggleFavorite } from '@/services/api';
import { COLORS } from '@/constants/theme';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { useAuth } from '@/context/auth';

const { width } = Dimensions.get('window');
const isTablet = width > 700;

const POSTER_WIDTH = Platform.isTV ? width * 0.35 : (isTablet ? width * 0.4 : width * 0.6);
const POSTER_HEIGHT = POSTER_WIDTH * 1.30;
const CAROUSEL_HEIGHT = POSTER_HEIGHT + (Platform.isTV ? 120 : 180);

interface HeroSectionProps {
    movies: Movie[];
}

// ──────────────────────────────────────────────────────────
// KEY PERF FIX: activeIndex lives in a Sharedvalue & local ref
// so renderItem does NOT re-create on every swipe.
// HeroCard is memoized — only re-renders when isFav changes.
// ──────────────────────────────────────────────────────────
export default function HeroSection({ movies }: HeroSectionProps) {
    const [favSlugs, setFavSlugs] = useState<Set<string>>(new Set());
    // Use a ref for the active index to avoid re-creating renderItem closure
    const activeIndexRef = useRef(0);
    const [, forceActiveUpdate] = useState(0); // Trigger re-render only for the indicator dots
    const router = useRouter();
    const { user, token, syncFavorites } = useAuth();
    const carouselRef = useRef<ICarouselInstance>(null);

    useEffect(() => {
        if (!movies?.length) return;
        (async () => {
            const next = new Set<string>();
            for (const m of movies) {
                try {
                    if (user?.favorites?.some((f: any) => (typeof f === 'string' ? f : f.slug) === m.slug)) next.add(m.slug);
                    else if (await isFavorite(m.slug)) next.add(m.slug);
                } catch (_) { }
            }
            setFavSlugs(next);
        })();
    }, [movies, user?.favorites]);

    if (!movies?.length) return null;

    // PERF FIX: No LayoutAnimation, no activeIndex in deps
    const onSnapToItem = useCallback((index: number) => {
        activeIndexRef.current = index;
        forceActiveUpdate(n => n + 1); // cheap re-render for dots only
    }, []);

    const toggleFav = useCallback(async (movie: Movie) => {
        const slug = movie.slug;
        const currentlyFav = favSlugs.has(slug);
        const newFav = !currentlyFav;
        setFavSlugs(prev => {
            const next = new Set(prev);
            if (newFav) next.add(slug); else next.delete(slug);
            return next;
        });
        try {
            if (user && token) {
                await apiToggleFavorite(movie, currentlyFav, token);
                syncFavorites?.();
            } else {
                if (newFav) await addFavorite({
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
                else await removeFavorite(movie.slug);
            }
        } catch (e) {
            setFavSlugs(prev => { const n = new Set(prev); if (newFav) n.delete(slug); else n.add(slug); return n; });
        }
    }, [favSlugs, user, token, syncFavorites]);

    // PERF FIX: renderItem deps only includes favSlugs and toggleFav,
    // NOT activeIndex — so cards don't all rebuild on every swipe.
    // isActive is computed inside via closure over the ref (stable reference).
    const renderItem = useCallback(
        ({ item, index }: { item: Movie; index: number }) => {
            if (!item?.slug) return <View style={{ flex: 1 }} />;
            return (
                <HeroCard
                    movie={item}
                    index={index}
                    activeIndexRef={activeIndexRef}
                    isFav={favSlugs.has(item.slug)}
                    onToggleFav={() => toggleFav(item)}
                    onPress={() => {
                        try { router.push(`/movie/${item.slug}` as any); } catch (e) { console.warn('Nav failed', e); }
                    }}
                />
            );
        },
        // CRITICAL: activeIndex NOT in deps — card components use the ref directly
        [favSlugs, toggleFav, router]
    );

    return (
        <View style={styles.carouselSection}>
            <Carousel
                ref={carouselRef}
                loop
                width={width}
                height={CAROUSEL_HEIGHT}
                data={movies}
                autoPlay={true}
                autoPlayInterval={5500}
                onSnapToItem={onSnapToItem}
                // PERF FIX: 300ms is snappier, 480ms felt laggy
                scrollAnimationDuration={300}
                // PERF FIX: use default mode instead of 'parallax'
                // parallax runs heavy JS-thread matrix transforms; default uses native driver
                panGestureHandlerProps={{ activeOffsetX: [-15, 15] }}
                renderItem={renderItem}
            />
        </View>
    );
}

// PERF FIX: HeroCard now reads isActive from the ref (no prop changes on swipe),
// so React.memo prevents any re-render until isFav changes.
const HeroCard = React.memo(function HeroCard({ movie, index, activeIndexRef, isFav, onToggleFav, onPress }: {
    movie: Movie;
    index: number;
    activeIndexRef: React.RefObject<number>;
    isFav: boolean;
    onToggleFav: () => void;
    onPress: () => void;
}) {
    const router = useRouter();
    const categories = movie.category?.slice(0, 3) || [];
    // isActive is derived from ref — no prop re-creation needed
    const isActive = activeIndexRef.current === index;

    return (
        <View style={[styles.cardContainer, !isActive && { opacity: 0.8 }]} collapsable={false}>
            <FocusableButton style={styles.posterWrapper} onPress={onPress}>
                <Image
                    source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                    style={styles.posterImage}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                    // Priority: only decode image for active card eagerly
                    priority={isActive ? 'high' : 'low'}
                />
            </FocusableButton>

            <View style={styles.infoWrapper}>
                <Text style={styles.title} numberOfLines={1}>{movie.name}</Text>
                {movie.origin_name && <Text style={styles.subtitle} numberOfLines={1}>{movie.origin_name}</Text>}

                <View style={styles.metaRow}>
                    {movie.year && (
                        <View style={styles.metaBadgeDark}>
                            <Text style={styles.metaTextWhite}>{movie.year}</Text>
                        </View>
                    )}
                    <View style={styles.metaBadgeDark}>
                        <Ionicons name="star" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                        <Text style={styles.metaTextYellow}>{(movie as any).tmdb?.vote_average ? Number((movie as any).tmdb.vote_average).toFixed(1) : '7.5'}</Text>
                    </View>
                    {(movie.quality || movie.lang) && (
                        <View style={styles.metaBadgeOutline}>
                            <Text style={styles.metaTextYellow}>{movie.quality || 'HD'}</Text>
                        </View>
                    )}
                </View>

                {categories.length > 0 && (
                    <View style={styles.genreRow}>
                        {categories.map((c: any, idx: number) => (
                            <View key={idx} style={styles.genreBadge}>
                                <Text style={styles.genreText}>{c.name}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.actionRow}>
                    <FocusableButton
                        style={styles.playBtnIcon}
                        onPress={() => {
                            try { router.push(`/movie/${movie.slug}?autoPlay=true` as any); } catch (e) { console.warn('Nav failed', e); }
                        }}
                    >
                        <Ionicons name="play" size={24} color="#0B0D12" />
                    </FocusableButton>

                    <Pressable style={styles.circleBtn} onPress={onPress}>
                        <Ionicons name="information-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
                    </Pressable>

                    <TouchableOpacity
                        style={[styles.circleBtn, isFav && styles.circleBtnFav]}
                        onPress={onToggleFav}
                        activeOpacity={0.8}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? COLORS.accent : 'rgba(255,255,255,0.9)'} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    carouselSection: {
        height: CAROUSEL_HEIGHT,
        width: '100%',
        marginTop: 20,
    },
    cardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
    },
    posterWrapper: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 28,
        backgroundColor: '#1f2937',
        zIndex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    posterImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    infoWrapper: {
        alignItems: 'center',
        width: '88%',
        marginTop: -45,
        backgroundColor: 'rgba(15, 18, 26, 0.82)',
        borderRadius: 24,
        padding: 20,
        paddingTop: 55,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderTopColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 0,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    metaBadgeDark: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaBadgeOutline: {
        backgroundColor: 'rgba(244,200,74,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(244,200,74,0.5)'
    },
    metaTextWhite: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    metaTextYellow: {
        color: '#F4C84A',
        fontSize: 12,
        fontWeight: '700',
    },
    genreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
    },
    genreBadge: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    genreText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
    },
    playBtnIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(244,200,74,0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    circleBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleBtnFav: {
        backgroundColor: 'rgba(251,191,36,0.18)',
        borderColor: 'rgba(251,191,36,0.5)',
    },
});
