import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, Dimensions, StyleSheet, Pressable,
    TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Movie, getImageUrl, toggleFavorite as apiToggleFavorite } from '@/services/api';
import { COLORS } from '@/constants/theme';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';
import { useAuth } from '@/context/auth';

const { width } = Dimensions.get('window');

// Compact horizontal hero — backdrop fullwidth 220px + poster nhỏ góc trái dưới + info
const HERO_BACKDROP_HEIGHT = 220;

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [favSlugs, setFavSlugs] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { user, token, syncFavorites } = useAuth();
    const scrollRef = useRef<ScrollView>(null);
    const autoTimer = useRef<any>(null);

    // Load favorites
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

    // Auto scroll
    const scrollTo = useCallback((idx: number) => {
        const clamped = Math.max(0, Math.min(movies.length - 1, idx));
        scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
        setActiveIndex(clamped);
    }, [movies.length]);

    useEffect(() => {
        if (!movies?.length || movies.length < 2) return;
        autoTimer.current = setInterval(() => {
            setActiveIndex(prev => {
                const next = (prev + 1) % movies.length;
                scrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
            });
        }, 5000);
        return () => clearInterval(autoTimer.current);
    }, [movies.length]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        if (idx !== activeIndex) {
            setActiveIndex(idx);
            clearInterval(autoTimer.current);
        }
    }, [activeIndex]);

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

    return (
        <View style={styles.wrapper}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScroll}
                decelerationRate="fast"
            >
                {movies.map((movie, index) => {
                    const backdropUri = getImageUrl(movie.thumb_url || movie.poster_url);
                    const posterUri = getImageUrl(movie.poster_url || movie.thumb_url);
                    const isFav = favSlugs.has(movie.slug);
                    const rating = (movie as any).tmdbData?.vote_average
                        ? Number((movie as any).tmdbData.vote_average).toFixed(1)
                        : null;

                    return (
                        <View key={movie.slug} style={{ width }}>
                            {/* Backdrop */}
                            <View style={styles.backdropContainer}>
                                <Image
                                    source={{ uri: backdropUri }}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                    contentPosition="top"
                                    priority={index === 0 ? 'high' : 'normal'}
                                    cachePolicy="memory-disk"
                                />
                                {/* Gradient overlay */}
                                <LinearGradient
                                    colors={['rgba(11,13,18,0)', 'rgba(11,13,18,0.5)', '#0B0D18']}
                                    style={StyleSheet.absoluteFill}
                                />
                                {/* Quality + rating badges */}
                                <View style={styles.badgesRow}>
                                    {movie.quality && (
                                        <View style={styles.badgeQuality}>
                                            <Text style={styles.badgeQualityText}>{movie.quality}</Text>
                                        </View>
                                    )}
                                    {rating && (
                                        <View style={styles.badgeRating}>
                                            <Ionicons name="star" size={10} color="#F4C84A" />
                                            <Text style={styles.badgeRatingText}>{rating}</Text>
                                        </View>
                                    )}
                                </View>
                                {/* Small poster — bottom-left */}
                                <Pressable
                                    style={styles.posterSmall}
                                    onPress={() => router.push(`/movie/${movie.slug}` as any)}
                                >
                                    <Image
                                        source={{ uri: posterUri }}
                                        style={{ width: '100%', height: '100%', borderRadius: 14 }}
                                        contentFit="cover"
                                        cachePolicy="memory-disk"
                                    />
                                </Pressable>
                            </View>

                            {/* Info block */}
                            <View style={styles.infoBlock}>
                                {/* Title area — aligned kế bên poster */}
                                <View style={styles.titleArea}>
                                    <Text style={styles.title} numberOfLines={2}>{movie.name}</Text>
                                    <View style={styles.metaRow}>
                                        {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
                                        {movie.category?.slice(0, 2).map((c: any) => (
                                            <Text key={c.id || c.name} style={styles.metaDot}>· {c.name}</Text>
                                        ))}
                                    </View>
                                </View>

                                {/* Action buttons */}
                                <View style={styles.actionRow}>
                                    <Pressable
                                        style={styles.playBtn}
                                        onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
                                    >
                                        <Ionicons name="play" size={18} color="#0B0D12" />
                                        <Text style={styles.playBtnText}>Xem ngay</Text>
                                    </Pressable>

                                    <Pressable
                                        style={styles.circleBtn}
                                        onPress={() => router.push(`/movie/${movie.slug}` as any)}
                                    >
                                        <Ionicons name="information-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
                                    </Pressable>

                                    <TouchableOpacity
                                        style={[styles.circleBtn, isFav && styles.circleBtnFav]}
                                        onPress={() => toggleFav(movie)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? COLORS.accent : 'rgba(255,255,255,0.9)'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Dot indicators */}
            {movies.length > 1 && (
                <View style={styles.dotsRow}>
                    {movies.map((_, i) => (
                        <Pressable key={i} onPress={() => scrollTo(i)}>
                            <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        backgroundColor: '#0B0D18',
        marginTop: 4,
    },
    backdropContainer: {
        width: '100%',
        height: HERO_BACKDROP_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
    },
    badgesRow: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 6,
        zIndex: 2,
    },
    badgeQuality: {
        backgroundColor: '#F4C84A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    badgeQualityText: {
        color: '#0B0D12',
        fontSize: 10,
        fontWeight: '800',
    },
    badgeRating: {
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    badgeRatingText: {
        color: '#F4C84A',
        fontSize: 10,
        fontWeight: '700',
    },
    posterSmall: {
        position: 'absolute',
        bottom: 12,
        left: 14,
        width: 70,
        height: 98,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        zIndex: 2,
    },
    infoBlock: {
        paddingHorizontal: 14,
        paddingTop: 2,
        paddingBottom: 4,
        flexDirection: 'column',
        gap: 8,
    },
    titleArea: {
        paddingLeft: 84,   // kế bên poster nhỏ
        minHeight: 60,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    metaText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    metaDot: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    playBtn: {
        flex: 1,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F4C84A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    playBtnText: {
        color: '#0B0D12',
        fontWeight: '800',
        fontSize: 13,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleBtnFav: {
        backgroundColor: 'rgba(244,200,74,0.18)',
        borderColor: 'rgba(244,200,74,0.5)',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 6,
        paddingTop: 4,
        gap: 5,
    },
    dot: { height: 5, borderRadius: 3 },
    dotActive: { width: 18, backgroundColor: '#F4C84A' },
    dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.25)' },
});
