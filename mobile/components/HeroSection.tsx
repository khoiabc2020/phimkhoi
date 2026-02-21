import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 700;

const POSTER_WIDTH = isTablet ? width * 0.4 : width * 0.6;
const POSTER_HEIGHT = POSTER_WIDTH * 1.45; // 2:3 aspect
const CAROUSEL_HEIGHT = POSTER_HEIGHT + 230; // Extra room for vertical stacked info

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();

    if (!movies?.length) return null;

    const onSnapToItem = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    return (
        <View style={styles.carouselSection}>
            <Carousel
                loop
                width={width}
                height={CAROUSEL_HEIGHT}
                data={movies}
                autoPlay={true}
                autoPlayInterval={6000}
                onSnapToItem={onSnapToItem}
                scrollAnimationDuration={800}
                mode="parallax"
                modeConfig={{
                    parallaxScrollingScale: 0.85,
                    parallaxScrollingOffset: 60,
                }}
                renderItem={({ item, index }) => (
                    <HeroCard
                        movie={item}
                        isActive={index === activeIndex}
                        onPress={() => router.push(`/movie/${item.slug}` as any)}
                    />
                )}
            />
        </View>
    );
}

function HeroCard({ movie, isActive, onPress }: { movie: Movie; isActive: boolean; onPress: () => void }) {
    const router = useRouter();
    const categories = movie.category?.slice(0, 3) || [];

    return (
        <View style={[styles.cardContainer, !isActive && { opacity: 0.4 }]}>
            {/* 1. Centered Poster */}
            <Pressable style={styles.posterWrapper} onPress={onPress}>
                <Image
                    source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                    style={styles.posterImage}
                    contentFit="cover"
                    transition={400}
                    cachePolicy="memory-disk" // Force memory-disk caching for lagless swipes
                />
            </Pressable>

            {/* 2. Vertically Stacked Movie Info */}
            <View style={styles.infoWrapper}>
                <Text style={styles.title} numberOfLines={1}>{movie.name}</Text>

                {movie.origin_name && (
                    <Text style={styles.subtitle} numberOfLines={1}>{movie.origin_name}</Text>
                )}

                {/* 3. Meta Row (Year, Rating, Quality) */}
                <View style={styles.metaRow}>
                    {movie.year && (
                        <View style={styles.metaBadgeDark}>
                            <Text style={styles.metaTextWhite}>{movie.year}</Text>
                        </View>
                    )}
                    {/* Placeholder for Rating (since KKPhim might lack TMDB for heroes instantly) */}
                    <View style={styles.metaBadgeDark}>
                        <Ionicons name="star" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                        <Text style={styles.metaTextYellow}>{(movie as any).tmdb?.vote_average ? (movie as any).tmdb.vote_average.toFixed(1) : '7.5'}</Text>
                    </View>
                    {(movie.quality || movie.lang) && (
                        <View style={styles.metaBadgeOutline}>
                            <Text style={styles.metaTextYellow}>{movie.quality || 'HD'}</Text>
                        </View>
                    )}
                </View>

                {/* 4. Genres */}
                {categories.length > 0 && (
                    <View style={styles.genreRow}>
                        {categories.map((c: any, idx: number) => (
                            <View key={idx} style={styles.genreBadge}>
                                <Text style={styles.genreText}>{c.name}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. Action Buttons */}
                <View style={styles.actionRow}>
                    <Pressable
                        style={styles.playBtn}
                        onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
                    >
                        <Ionicons name="play" size={18} color="black" style={{ marginLeft: 3 }} />
                        <Text style={styles.playBtnText}>Xem</Text>
                    </Pressable>

                    <Pressable style={styles.circleBtn} onPress={onPress}>
                        <Ionicons name="information-outline" size={22} color="white" />
                    </Pressable>

                    <Pressable style={styles.circleBtn} onPress={() => {/* Handle fav */ }}>
                        <Ionicons name="heart-outline" size={20} color="white" />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    carouselSection: {
        height: CAROUSEL_HEIGHT,
        width: '100%',
        marginTop: 20, // Add space under header
    },
    cardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 10,
    },
    posterWrapper: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#1f2937',
        // Removed heavy animated shadows to fix Parallax FPS lag on Android
    },
    posterImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    infoWrapper: {
        alignItems: 'center',
        width: '90%',
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        color: '#fbbf24',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    metaBadgeDark: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    metaBadgeOutline: {
        backgroundColor: 'rgba(251,191,36,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fbbf24'
    },
    metaTextWhite: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    metaTextYellow: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '800',
    },
    genreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
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
        gap: 16,
    },
    playBtn: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 32,
        height: 46,
        borderRadius: 23,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        // Removed heavy shadows
    },
    playBtnText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '800',
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
});
