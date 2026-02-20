import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const POSTER_HEIGHT = 310;
const POSTER_WIDTH = width * 0.60;
const CAROUSEL_HEIGHT = POSTER_HEIGHT + 20; // Extra for parallax clipping

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
                    autoPlayInterval={5000}
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

            {/* ── SECTION 2: Info — always below image ── */}
            <View style={styles.infoSection}>
                <Text style={styles.title} numberOfLines={1}>
                    {activeMovie?.name}
                </Text>

                <Text style={styles.meta}>
                    {activeMovie?.origin_name}
                    {activeMovie?.year ? ` • ${activeMovie.year}` : ''}
                    {' • '}
                    <Text style={{ color: COLORS.accent, fontWeight: '700' }}>
                        {activeMovie?.quality || 'FHD'}
                    </Text>
                </Text>

                <View style={styles.actionRow}>
                    <Pressable
                        style={styles.primaryBtn}
                        onPress={() => router.push(`/movie/${activeMovie.slug}` as any)}
                    >
                        <Ionicons name="play" size={16} color="black" />
                        <Text style={styles.primaryBtnText}>Xem ngay</Text>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => router.push(`/movie/${activeMovie.slug}` as any)}
                    >
                        <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                </View>
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
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.2)']}
                style={StyleSheet.absoluteFill}
            />
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
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: COLORS.bg1,
        alignSelf: 'center',
    },
    cardActive: {
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },

    // Section 2: info below image (completely separate from carousel)
    infoSection: {
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 8,
        paddingHorizontal: 20,
        backgroundColor: COLORS.bg0, // Solid bg so it's clearly below
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    meta: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 14,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    primaryBtn: {
        height: 42,
        paddingHorizontal: 28,
        backgroundColor: COLORS.accent,
        borderRadius: 21,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: 'black',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
