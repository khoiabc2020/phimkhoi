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
                    blurRadius={80}
                    contentFit="cover"
                    transition={800}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,13,18,0.5)' }]} />
                <LinearGradient
                    colors={['transparent', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.3, 0.9]}
                />
            </View>

            {/* 2. Compact Carousel */}
            <View style={styles.carouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={POSTER_HEIGHT + 20}
                    data={movies}
                    onSnapToItem={onSnapToItem}
                    scrollAnimationDuration={500}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.86,
                        parallaxScrollingOffset: 50,
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
                            <Ionicons name="information-circle-outline" size={22} color="rgba(255,255,255,0.8)" />
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
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.1)']}
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
        marginTop: 0,
        zIndex: 10,
    },
    // Poster
    cardContainer: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: COLORS.bg1,
        alignSelf: 'center',
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardImage: { width: '100%', height: '100%' },

    // Info
    infoContainer: {
        alignItems: 'center',
        marginTop: 12, // Tighter spacing
        paddingHorizontal: 20,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 24, // Slightly smaller for compactness
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    inlineMeta: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 12,
    },

    // Buttons Buttons
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    primaryBtn: {
        width: 140, // Compact Width
        height: 44, // Compact Height 44dp
        backgroundColor: COLORS.accent,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryBtnText: {
        color: 'black',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
