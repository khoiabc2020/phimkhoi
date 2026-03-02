import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import Animated, { useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Chiều cao Carousel gọn lại để đẩy lên cao, tiết kiệm diện tích
const CAROUSEL_HEIGHT = width * 1.15;

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [favSlugs, setFavSlugs] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { user, token, syncFavorites } = useAuth();

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
    }, [movies, user]);

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

    const activeMovie = movies[activeIndex] || movies[0];
    const activeBackdropUri = getImageUrl(activeMovie.thumb_url || activeMovie.poster_url);

    return (
        <View style={styles.wrapper}>
            {/* Background Image Blurred */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    key={activeBackdropUri}
                    source={{ uri: activeBackdropUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    blurRadius={Platform.OS === 'ios' ? 15 : 3}
                    transition={Platform.OS === 'ios' ? 300 : 0}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,13,24,0.7)' }]} />
                <LinearGradient
                    colors={['transparent', '#0B0D18']}
                    style={[StyleSheet.absoluteFill, { top: '30%' }]}
                />
            </View>

            <View style={{ marginTop: 15 }}>
                <Carousel
                    width={width}
                    height={CAROUSEL_HEIGHT}
                    data={movies}
                    loop={true}
                    autoPlay={true}
                    autoPlayInterval={4000}
                    scrollAnimationDuration={1000}
                    onSnapToItem={(index) => setActiveIndex(index)}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.85,
                        parallaxScrollingOffset: 55,
                    }}
                    panGestureHandlerProps={{
                        activeOffsetX: [-10, 10], // Allow vertical scrolling to pass through
                    }}
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

const HeroSlide = React.memo(function HeroSlide({ movie, index, isFav, onToggleFav }: { movie: Movie; index: number; isFav: boolean; onToggleFav: () => void }) {
    const router = useRouter();
    const posterUri = getImageUrl(movie.poster_url || movie.thumb_url);
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
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Tags on top-right */}
                <View style={styles.badgesRow}>
                    {movie.quality && (
                        <View style={styles.badgeQuality}>
                            <Text style={styles.badgeQualityText}>{movie.quality}</Text>
                        </View>
                    )}
                    {rating && (
                        <View style={styles.badgeRating}>
                            <Ionicons name="star" size={12} color="#F4C84A" />
                            <Text style={styles.badgeRatingText}>{rating}</Text>
                        </View>
                    )}
                </View>

                {/* Info block overlaid at the bottom of the poster */}
                <View style={styles.infoBlock}>
                    <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>{movie.name}</Text>
                    <View style={styles.metaRow}>
                        {movie.year && <Text style={styles.metaText}>{movie.year}</Text>}
                        {movie.category?.slice(0, 2).map((c: any) => (
                            <Text key={c.id || c.name} style={styles.metaDot}>· {c.name}</Text>
                        ))}
                    </View>

                    <View style={styles.actionRow}>
                        {/* Nút Xem Phim */}
                        <Pressable
                            style={styles.playBtn}
                            onPress={(e) => {
                                e.stopPropagation(); // Avoid triggering card press
                                router.push(`/movie/${movie.slug}?autoPlay=true` as any);
                            }}
                        >
                            <Ionicons name="play" size={18} color="#0B0D12" />
                            <Text style={styles.playBtnText}>XEM</Text>
                        </Pressable>

                        {/* Nút Chi Tiết */}
                        <Pressable
                            style={styles.detailBtn}
                            onPress={(e) => {
                                e.stopPropagation();
                                router.push(`/movie/${movie.slug}` as any);
                            }}
                        >
                            <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.detailBtnText}>CHI TIẾT</Text>
                        </Pressable>

                        {/* Nút Yêu Thích */}
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
        overflow: 'hidden'
    },
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterWrapper: {
        width: '90%',  // takes 90% of the item width generated by Carousel
        height: '98%',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 15,
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
        backgroundColor: '#F4C84A',
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
        color: '#F4C84A',
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
        backgroundColor: '#F4C84A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#F4C84A',
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
    dotActive: { width: 22, backgroundColor: '#F4C84A' },
    dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' },
});
