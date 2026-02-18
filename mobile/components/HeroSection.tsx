import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Optimized Specs
const HERO_HEIGHT = height * 0.65; // Total Hero Section Height (< 65%)
const POSTER_HEIGHT = 400; // Fixed max height
const POSTER_WIDTH = width * 0.72; // Centered Card Width

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
            {/* 1. Cinematic Ambient Background */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.poster_url || activeMovie?.thumb_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={90} // Strong blur for ambient glow
                    contentFit="cover"
                    transition={800}
                />
                {/* Darken overlay for contrast */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,13,18,0.6)' }]} />
                {/* Bottom fade to blend with body */}
                <LinearGradient
                    colors={['transparent', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.4, 1]}
                />
            </View>

            {/* 2. Centered Poster Carousel */}
            <View style={styles.carouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={POSTER_HEIGHT + 20} // Add space for shadow
                    data={movies}
                    onSnapToItem={onSnapToItem}
                    scrollAnimationDuration={500}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.88,
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

            {/* 3. Info Section (Below Poster) */}
            <View style={styles.infoContainer}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={1}>
                    {activeMovie?.name}
                </Text>

                {/* Meta Row */}
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{activeMovie?.origin_name}</Text>
                    <View style={styles.dotSeparator} />
                    <Text style={styles.metaText}>{activeMovie?.year}</Text>
                    <View style={styles.dotSeparator} />
                    <View style={styles.glassChip}>
                        <Text style={styles.chipText}>{activeMovie?.quality || 'HD'}</Text>
                    </View>
                </View>

                {/* Buttons Row - Optimized Height */}
                <View style={styles.actionRow}>
                    <Link href={`/movie/${activeMovie.slug}` as any} asChild>
                        <Pressable style={styles.primaryBtn}>
                            <Ionicons name="play" size={20} color="black" />
                            <Text style={styles.primaryBtnText}>Xem ngay</Text>
                        </Pressable>
                    </Link>

                    <Link href={`/movie/${activeMovie.slug}` as any} asChild>
                        <Pressable style={styles.secondaryBtn}>
                            <Ionicons name="information-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
                        </Pressable>
                    </Link>
                </View>
            </View>
        </View>
    );
}

function HeroCard({ movie, isActive, onPress }: { movie: Movie, isActive: boolean, onPress: () => void }) {
    return (
        <Pressable
            style={[styles.cardContainer, isActive && styles.cardActive]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                style={styles.cardImage}
                contentFit="cover"
                transition={400}
            />
            {/* Inner Gradient for Depth */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)']}
                style={StyleSheet.absoluteFill}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: HERO_HEIGHT,
        width: '100%',
        justifyContent: 'flex-start',
        paddingTop: 10,
    },
    carouselContainer: {
        alignItems: 'center',
        marginTop: 10,
        zIndex: 10,
    },
    // Poster Card Specs
    cardContainer: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 28, // High radius
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: COLORS.bg1,
        alignSelf: 'center',
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: COLORS.accent, // Ambient glow
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12, // Android shadow
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },

    // Info Section
    infoContainer: {
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 24,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 26,
        fontWeight: '700', // Semibold
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    metaText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.textSecondary,
        opacity: 0.5,
    },
    glassChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    chipText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },

    // Buttons
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
        maxWidth: 280, // Constrain width
    },
    primaryBtn: {
        flex: 1,
        height: 48, // Compact height
        backgroundColor: COLORS.accent,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },
    primaryBtnText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)', // Glass
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
