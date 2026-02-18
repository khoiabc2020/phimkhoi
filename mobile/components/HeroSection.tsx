import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS, RADIUS, SPACING, BLUR } from '@/constants/theme';
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
            {/* Ambient Background Blur - deep depth */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.thumb_url || activeMovie?.poster_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={80} // Very strong blur for ambient light
                    contentFit="cover"
                    transition={800}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11, 13, 18, 0.7)' }]} />
                <LinearGradient
                    colors={['transparent', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.2, 1]}
                />
            </View>

            {/* Cinematic Carousel */}
            <Carousel
                loop
                width={width}
                height={height * 0.62} // Taller for cinematic look
                data={movies}
                onSnapToItem={onSnapToItem}
                scrollAnimationDuration={500}
                mode="parallax" // Parallax effect built-in
                modeConfig={{
                    parallaxScrollingScale: 0.92,
                    parallaxScrollingOffset: 40,
                }}
                renderItem={({ item, index }) => (
                    <HeroCard
                        movie={item}
                        isActive={index === activeIndex}
                        onPress={() => router.push(`/movie/${item.slug}` as any)}
                    />
                )}
            />

            {/* Pagination Dots */}
            <View style={styles.dotsRow}>
                {movies.slice(0, 8).map((_, i) => ( // Limit dots
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: i === activeIndex ? COLORS.accent : 'rgba(255,255,255,0.2)',
                                width: i === activeIndex ? 20 : 6,
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

// Individual Hero Card
function HeroCard({ movie, isActive, onPress }: {
    movie: Movie;
    isActive: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={[styles.cardContainer, isActive && styles.cardActive]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Poster Image */}
            <Image
                source={{ uri: getImageUrl(movie?.thumb_url || movie?.poster_url) }}
                style={styles.cardImage}
                contentFit="cover"
                transition={400}
            />

            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.5, 1]}
            />

            {/* Content within Poster */}
            <View style={styles.cardContent}>
                {/* Meta Chips Row */}
                <View style={styles.metaRow}>
                    <View style={styles.glassChip}>
                        <Text style={styles.chipText}>{movie.quality || 'HD'}</Text>
                    </View>
                    <View style={styles.glassChip}>
                        <Text style={styles.chipText}>{movie.lang || 'Vietsub'}</Text>
                    </View>
                    <View style={styles.glassChip}>
                        <Text style={[styles.chipText, { color: COLORS.accent }]}>★ {movie.view ? (movie.view / 1000).toFixed(1) : '8.5'}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {movie.name}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    {movie.origin_name} • {movie.year}
                </Text>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                    <Link href={`/movie/${movie.slug}` as any} asChild>
                        <Pressable style={styles.primaryBtn}>
                            <Ionicons name="play" size={20} color="black" />
                            <Text style={styles.primaryBtnText}>Xem ngay</Text>
                        </Pressable>
                    </Link>

                    <Link href={`/movie/${movie.slug}` as any} asChild>
                        <Pressable style={styles.glassBtn}>
                            <Ionicons name="information-circle-outline" size={24} color="white" />
                        </Pressable>
                    </Link>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: height * 0.7,
        position: 'relative',
        marginBottom: 20,
    },
    // Card Styles
    cardContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 32, // Large radius
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: COLORS.bg1,
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 32,
    },

    // Typography
    title: {
        color: COLORS.textPrimary,
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 16,
    },

    // Meta Chips
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    glassChip: {
        backgroundColor: 'rgba(255,255,255,0.12)', // Glass opacity
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100, // Pill shape
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)', // Web support
    },
    chipText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    primaryBtn: {
        flex: 1,
        height: 54, // Large touch target
        backgroundColor: COLORS.accent,
        borderRadius: 27, // Fully rounded
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    primaryBtnText: {
        color: 'black', // Contrast
        fontSize: 16,
        fontWeight: '700',
    },
    glassBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Dots
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
});
