import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 700;

const POSTER_WIDTH = isTablet ? width * 0.45 : width * 0.72;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5; // Maintain 2:3 aspect roughly
const CAROUSEL_HEIGHT = POSTER_HEIGHT + 40; // Extra for parallax clipping and shadow

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const router = useRouter();

    if (!movies?.length) return null;

    const activeMovie = movies[activeIndex];

    const onSnapToItem = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    return (
        // Outer wrapper: plain flex column — carousel on top, info below
        <View>
            {/* ── SECTION 1: Carousel with ambient background ── */}
            <View style={styles.carouselSection}>
                {/* Blurred ambient background fills carousel section only */}
                <Image
                    source={{ uri: getImageUrl(activeMovie?.poster_url || activeMovie?.thumb_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={70}
                    contentFit="cover"
                    transition={800}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,12,18,0.55)' }]} />
                <LinearGradient
                    colors={['transparent', COLORS.bg0]}
                    style={StyleSheet.absoluteFill}
                    locations={[0.5, 1]}
                />

                {/* Poster Carousel */}
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
                        parallaxScrollingScale: 0.88,
                        parallaxScrollingOffset: 55,
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
        </View>
    );
}

function HeroCard({ movie, isActive, onPress }: { movie: Movie; isActive: boolean; onPress: () => void }) {
    return (
        <Pressable
            style={[styles.card, isActive && styles.cardActive]}
            onPress={onPress}
        >
            <Image
                source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={400}
            />
            {/* Gradient Darkener to ensure text readability */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.7)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            {/* TOP: Title & Meta positioned cleanly at top */}
            <View style={styles.innerTopInfo}>
                <Text style={styles.innerTitle} numberOfLines={2}>{movie.name}</Text>
                <Text style={styles.innerMeta}>
                    {movie.year ? `${movie.year}` : ''}
                    {movie.year && movie.quality ? ' • ' : ''}
                    <Text style={{ color: COLORS.accent, fontWeight: '800' }}>
                        {movie.quality || 'FHD'}
                    </Text>
                </Text>
            </View>

            {/* BOTTOM: Action Buttons in Liquid Glass */}
            <View style={styles.innerBottomActions}>
                <BlurView intensity={70} tint="dark" style={styles.glassActionContainer}>
                    <Pressable style={styles.primaryBtn} onPress={onPress}>
                        <Ionicons name="play" size={18} color="black" style={{ marginLeft: 3 }} />
                        <Text style={styles.primaryBtnText}>Xem ngay</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryBtn} onPress={onPress}>
                        <Ionicons name="information" size={22} color="white" />
                    </Pressable>
                </BlurView>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    // Section 1: fixed-height container for carousel + background
    carouselSection: {
        height: CAROUSEL_HEIGHT,
        width: '100%',
        overflow: 'hidden',
    },

    // Poster card
    card: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: COLORS.bg1,
        alignSelf: 'center',
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
    },

    // Inner Elements (Liquid Glass Design)
    innerTopInfo: {
        position: 'absolute',
        top: 20,
        left: 16,
        right: 16,
        alignItems: 'center',
    },
    innerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.85)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    innerMeta: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    innerBottomActions: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    glassActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    primaryBtn: {
        flex: 1,
        height: 44,
        backgroundColor: COLORS.accent,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryBtnText: {
        color: 'black',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    secondaryBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
});
