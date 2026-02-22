import { View, Text, Dimensions, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import FocusableButton from './FocusableButton';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState, useCallback } from 'react';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isTablet = width > 700;

const POSTER_WIDTH = Platform.isTV ? width * 0.35 : (isTablet ? width * 0.4 : width * 0.6);
const POSTER_HEIGHT = POSTER_WIDTH * 1.30;
const CAROUSEL_HEIGHT = POSTER_HEIGHT + (Platform.isTV ? 120 : 180);

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
            <FocusableButton style={styles.posterWrapper} onPress={onPress}>
                <Image
                    source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
                    style={styles.posterImage}
                    contentFit="cover"
                    transition={400}
                    cachePolicy="memory-disk" // Force memory-disk caching for lagless swipes
                />
            </FocusableButton>

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
                    <FocusableButton
                        style={styles.playBtn}
                        onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
                    >
                        <Ionicons name="play" size={18} color="black" style={{ marginLeft: 3 }} />
                        <Text style={styles.playBtnText}>Xem</Text>
                    </FocusableButton>

                    <FocusableButton style={styles.circleBtn} onPress={onPress}>
                        <Ionicons name="information-outline" size={22} color="white" />
                    </FocusableButton>

                    <FocusableButton style={styles.circleBtn} onPress={() => {/* Handle fav */ }}>
                        <Ionicons name="heart-outline" size={20} color="white" />
                    </FocusableButton>
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
        justifyContent: 'center',
        paddingTop: 10,
    },
    posterWrapper: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: 28,
        backgroundColor: '#1f2937',
        zIndex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    posterImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    infoWrapper: {
        alignItems: 'center',
        width: '88%',
        marginTop: -45,
        backgroundColor: 'rgba(15, 18, 26, 0.82)',
        borderRadius: 24,
        padding: 20,
        paddingTop: 55,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderTopColor: 'rgba(255, 255, 255, 0.25)',
        zIndex: 0,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    metaBadgeDark: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaBadgeOutline: {
        backgroundColor: 'rgba(244,200,74,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(244,200,74,0.5)'
    },
    metaTextWhite: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    metaTextYellow: {
        color: '#F4C84A',
        fontSize: 12,
        fontWeight: '700',
    },
    genreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 18,
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
        backgroundColor: '#F4C84A',
        paddingHorizontal: 32,
        height: 46,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    playBtnText: {
        color: '#0B0D12',
        fontSize: 15,
        fontWeight: '500',
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
