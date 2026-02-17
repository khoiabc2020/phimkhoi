import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Movie, getImageUrl } from '@/services/api';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.68; // Increased to 68% for a more prominent vertical look (RoPhim standard)
const ITEM_HEIGHT = ITEM_WIDTH * 1.5; // Strict 2:3 Ratio

interface HeroSectionProps {
    movies: Movie[];
}

const BUTTON_WIDTH = (width - 48) / 2;

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!movies.length) return null;

    const activeMovie = movies[activeIndex];

    return (
        <View style={styles.container}>
            {/* Dynamic Background */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.poster_url || activeMovie?.thumb_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={30}
                    contentFit="cover"
                    transition={500}
                />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                <LinearGradient
                    colors={['transparent', '#111827']}
                    style={StyleSheet.absoluteFill}
                    locations={[0.4, 0.9]}
                />
            </View>

            {/* Header Spacing  */}
            <View style={{ marginTop: 100 }} />

            {/* Carousel */}
            <Carousel
                loop={true}
                width={width}
                height={ITEM_HEIGHT}
                autoPlay={false}
                data={movies}
                mode="parallax"
                modeConfig={{
                    parallaxScrollingScale: 0.85, // More "shrunken" inactive items
                    parallaxScrollingOffset: 60,
                }}
                onSnapToItem={(index) => setActiveIndex(index)}
                renderItem={({ item, index }) => (
                    <Link href={`/movie/${item.slug}`} asChild>
                        <Pressable style={styles.posterWrapper}>
                            <Image
                                source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                style={styles.posterImage}
                                contentFit="cover"
                                transition={300}
                            />
                            {/* Top 3 Rank Badge */}
                            {index < 3 && (
                                <View style={styles.rankBadge}>
                                    <Text style={[
                                        styles.rankText,
                                        index === 0 ? { color: '#fbbf24' } : // Top 1 Gold
                                            index === 1 ? { color: '#94a3b8' } : // Top 2 Silver
                                                { color: '#b45309' } // Top 3 Bronze
                                    ]}>
                                        {index + 1}
                                    </Text>
                                    <Text style={styles.topText}>TOP</Text>
                                </View>
                            )}
                        </Pressable>
                    </Link>
                )}
            />

            {/* Info Section - Matches Image 3 Layout */}
            <View style={styles.infoContainer}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {activeMovie?.name}
                </Text>

                {/* English Name */}
                <Text style={styles.subtitle} numberOfLines={1}>
                    {activeMovie?.origin_name}
                </Text>

                {/* Buttons - Row: Yellow | White */}
                <View style={styles.buttonRow}>
                    <Link href={activeMovie ? `/player/${activeMovie.slug}` as any : '/'} asChild>
                        <Pressable style={styles.playButton}>
                            <Ionicons name="play" size={20} color="black" />
                            <Text style={styles.playButtonText}>Xem phim</Text>
                        </Pressable>
                    </Link>

                    <Link href={activeMovie ? `/movie/${activeMovie.slug}` as any : '/'} asChild>
                        <Pressable style={styles.infoButton}>
                            <Ionicons name="information-circle-outline" size={22} color="black" />
                            <Text style={styles.infoButtonText}>Thông tin</Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Badges Row - Image 3 Style: [IMDb] [T16] [2024] [Phần 3] [Tập 5] */}
                <View style={styles.badgeRow}>
                    <View style={styles.imdbBadge}>
                        <Text style={styles.imdbText}>IMDb 8.5</Text>
                    </View>
                    <View style={styles.outlineBadge}>
                        <Text style={styles.outlineText}>T16</Text>
                    </View>
                    <View style={styles.outlineBadge}>
                        <Text style={styles.outlineText}>{activeMovie?.year}</Text>
                    </View>
                    {activeMovie?.episode_current && (
                        <View style={styles.outlineBadge}>
                            <Text style={styles.outlineText}>{activeMovie?.episode_current}</Text>
                        </View>
                    )}
                </View>

                {/* Description - Bottom Text */}
                <Text style={styles.description} numberOfLines={2}>
                    {activeMovie?.content?.replace(/<[^>]*>/g, '').trim() || "Mô tả đang được cập nhật..."}
                </Text>

                {/* Dots */}
                <View style={styles.dotsRow}>
                    {movies.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === activeIndex ? 'white' : 'rgba(255,255,255,0.3)',
                                    width: i === activeIndex ? 24 : 6
                                }
                            ]}
                        />
                    ))}
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: height * 0.85, // Need height for description
        position: 'relative',
        alignItems: 'center',
    },
    posterWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    posterImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 16, // Reduced top margin
        width: '100%',
    },
    title: {
        color: 'white',
        fontSize: 18, // Restored size for readability and impact
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        marginTop: 12,
        paddingHorizontal: 10,
    },
    subtitle: {
        color: '#9ca3af',
        fontSize: 12, // slightly larger
        textAlign: 'center',
        marginBottom: 12,
    },
    input: {
        // placeholder to ensure context
    },
    // ... skipping unrelated styles ... 
    description: {
        color: '#d1d5db',
        fontSize: 13, // Restored size
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
        paddingHorizontal: 16,
        opacity: 0.8
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        justifyContent: 'center',
    },
    imdbTag: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    imdbText: {
        color: '#fbbf24',
        fontWeight: 'bold',
        fontSize: 9, // Reduced
    },
    metaTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    metaText: {
        color: '#e5e7eb',
        fontSize: 10,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
        width: '100%',
        justifyContent: 'center',
        paddingHorizontal: 32, // Constrain width more
    },
    playButton: {
        backgroundColor: '#fbbf24',
        paddingVertical: 8, // Reduced height
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
    },
    playButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 13, // Reduced
    },
    infoButton: {
        backgroundColor: 'white',
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flex: 1,
    },
    infoButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 13,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        marginBottom: 12,
    },
    imdbBadge: {
        borderWidth: 1,
        borderColor: '#fbbf24',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    outlineBadge: {
        borderWidth: 1,
        borderColor: 'white',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    outlineText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
    },
    description: {
        color: '#d1d5db',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -15, // Hanging off the bottom-left
        left: -10,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    rankText: {
        fontSize: 70, // HUGE Number
        fontWeight: '900',
        fontStyle: 'italic',
        includeFontPadding: false,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        fontFamily: 'System', // Or a custom robust font if available
    },
    topText: {
        display: 'none', // Hide "TOP" text, just show the Big Number like RoPhim
    },
});
