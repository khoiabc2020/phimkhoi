import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Compressed iOS 26 Specs
const HERO_HEIGHT = 540; // Fixed total height
const POSTER_HEIGHT = 360; // Max height 360dp
const POSTER_WIDTH = width * 0.68; // Slightly narrower for elegance

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
                    blurRadius={90} // Stronger blur for cinematic feel
                    contentFit="cover"
                    transition={800}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,13,18,0.6)' }]} />
                <LinearGradient
                    colors={['transparent', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.2, 0.9]}
                />
            </View>

            {/* 2. Compact Carousel */}
            <View style={styles.carouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={POSTER_HEIGHT + 30}
                    data={movies}
                    onSnapToItem={onSnapToItem}
                    scrollAnimationDuration={600}
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

            {/* 3. Compression Info Section */}
            <View style={styles.infoContainer}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={1}>
                    {activeMovie?.name}
                </Text>

                {/* Inline Meta: Origins • Year • Quality */}
                <Text style={styles.inlineMeta}>
                    {activeMovie?.origin_name} • {activeMovie?.year} • <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{activeMovie?.quality || 'FHD'}</Text>
                </Text>

                {/* Compact CTA Row */}
                <View style={styles.actionRow}>
                    <Link href={`/movie/${activeMovie.slug}` as any} asChild>
                        <Pressable style={styles.primaryBtn}>
                            <Ionicons name="play" size={18} color="black" />
                            <Text style={styles.primaryBtnText}>Xem ngay</Text>
                        </Pressable>
                    </Link>

                    <Link href={`/movie/${activeMovie.slug}` as any} asChild>
                        <Pressable style={styles.secondaryBtn}>
                            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
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
            activeOpacity={0.95}
        >
            <Image
                source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                style={styles.cardImage}
                contentFit="cover"
                transition={500}
            />
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
        paddingTop: 0,
    },
    carouselContainer: {
        alignItems: 'center',
        marginTop: 10,
        zIndex: 10,
    },
    // Poster
    cardContainer: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 32, // Liquid Radius
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: COLORS.bg1,
        alignSelf: 'center',
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
    },
    cardImage: { width: '100%', height: '100%' },

    // Info
    infoContainer: {
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 26,
        fontWeight: '800', // Thicker font
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.8, // Tighter tracking
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    inlineMeta: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 16,
        opacity: 0.8,
    },

    // Buttons Buttons
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    primaryBtn: {
        width: 150,
        height: 48, // Standard iOS Button Height
        backgroundColor: COLORS.accent,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    primaryBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // For BlurView
    },
});
