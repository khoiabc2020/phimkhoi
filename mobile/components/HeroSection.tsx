import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();

    if (!movies.length) return null;

    const activeMovie = movies[activeIndex];

    const onSnapToItem = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    return (
        <View style={styles.container}>
            {/* Blurred Background - changes with active movie */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.thumb_url || activeMovie?.poster_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={50}
                    contentFit="cover"
                    transition={600}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', '#0a0a0f']}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.55, 0.9]}
                />
            </View>

            {/* Swipeable Carousel */}
            <Carousel
                loop
                width={width}
                height={height * 0.52}
                data={movies}
                onSnapToItem={onSnapToItem}
                scrollAnimationDuration={400}
                renderItem={({ item, index }) => (
                    <CarouselItem
                        movie={item}
                        isActive={index === activeIndex}
                        onPress={() => router.push(`/movie/${item.slug}` as any)}
                    />
                )}
            />

            {/* Movie Info Section */}
            <View style={styles.infoContainer}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {activeMovie?.name}
                </Text>

                {/* English Name */}
                <Text style={styles.subtitle} numberOfLines={1}>
                    {activeMovie?.origin_name}
                </Text>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <Link href={activeMovie ? `/movie/${activeMovie.slug}` : '/'} asChild>
                        <Pressable style={styles.playButton}>
                            <Ionicons name="play" size={18} color="black" />
                            <Text style={styles.playButtonText}>Xem Phim</Text>
                        </Pressable>
                    </Link>

                    <Link href={activeMovie ? `/movie/${activeMovie.slug}` : '/'} asChild>
                        <Pressable style={styles.infoButton}>
                            <Ionicons name="information-circle" size={20} color="black" />
                            <Text style={styles.infoButtonText}>Thông tin</Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Info Badges Row */}
                <View style={styles.badgeRow}>
                    <View style={styles.imdbBadge}>
                        <Text style={styles.imdbText}>IMDb</Text>
                        <Text style={styles.imdbScore}>
                            {activeMovie?.view ? (activeMovie.view / 1000).toFixed(1) : 'N/A'}
                        </Text>
                    </View>

                    {activeMovie?.quality && (
                        <View style={styles.qualityBadge}>
                            <Text style={styles.badgeText}>{activeMovie.quality}</Text>
                        </View>
                    )}

                    {activeMovie?.lang && (
                        <View style={styles.qualityBadge}>
                            <Text style={styles.badgeText}>{activeMovie.lang}</Text>
                        </View>
                    )}

                    {activeMovie?.year && (
                        <View style={styles.qualityBadge}>
                            <Text style={styles.badgeText}>{activeMovie.year}</Text>
                        </View>
                    )}

                    {activeMovie?.episode_current && (
                        <View style={styles.qualityBadge}>
                            <Text style={styles.badgeText}>{activeMovie.episode_current}</Text>
                        </View>
                    )}
                </View>

                {/* Carousel Dots */}
                <View style={styles.dotsRow}>
                    {movies.slice(0, 10).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === activeIndex ? 'white' : 'rgba(255,255,255,0.3)',
                                    width: i === activeIndex ? 24 : 6,
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

// Individual carousel item
function CarouselItem({ movie, isActive, onPress }: {
    movie: Movie;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[styles.carouselItem, isActive && styles.carouselItemActive]}
            onPress={onPress}
        >
            <Image
                source={{ uri: getImageUrl(movie?.thumb_url || movie?.poster_url) }}
                style={styles.carouselImage}
                contentFit="cover"
                transition={300}
            />
            {/* Subtle bottom gradient on card */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={StyleSheet.absoluteFill}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: height * 0.82,
        position: 'relative',
        backgroundColor: '#0a0a0f',
    },
    // Carousel
    carouselItem: {
        width: width * 0.6,
        height: '90%',
        borderRadius: 18,
        overflow: 'hidden',
        alignSelf: 'center',
        marginTop: 10,
        opacity: 0.5,
        transform: [{ scale: 0.88 }],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    carouselItemActive: {
        opacity: 1,
        transform: [{ scale: 1 }],
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    // Info
    infoContainer: {
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        paddingTop: 16,
    },
    title: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 4,
        paddingHorizontal: 10,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: -0.3,
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
        width: '100%',
        paddingHorizontal: 16,
    },
    playButton: {
        backgroundColor: '#fbbf24',
        paddingVertical: 13,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
    },
    playButtonText: {
        color: 'black',
        fontWeight: '800',
        fontSize: 14,
    },
    infoButton: {
        backgroundColor: 'white',
        paddingVertical: 13,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
    },
    infoButtonText: {
        color: 'black',
        fontWeight: '700',
        fontSize: 14,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    imdbBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: '#fbbf24',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    imdbText: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 10,
    },
    imdbScore: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 11,
    },
    qualityBadge: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    badgeText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 11,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        height: 5,
        borderRadius: 2.5,
    },
});
