import { View, Text, Dimensions, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Movie, getImageUrl } from '@/services/api';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.65; // Matches the reference card width
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface HeroSectionProps {
    movies: Movie[];
}

const BUTTON_WIDTH = (width - 60) / 2;

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
                    resizeMode="cover"
                />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                <LinearGradient
                    colors={['transparent', 'rgba(17, 24, 39, 0.8)', '#111827']}
                    style={StyleSheet.absoluteFill}
                    locations={[0.4, 0.7, 1]}
                />
            </View>

            {/* Header Content padding */}
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
                    parallaxScrollingScale: 0.9,
                    parallaxScrollingOffset: 50,
                }}
                onSnapToItem={(index) => setActiveIndex(index)}
                renderItem={({ item }) => (
                    <Link href={`/movie/${item.slug}`} asChild>
                        <Pressable style={styles.posterWrapper}>
                            <Image
                                source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                style={styles.posterImage}
                                resizeMode="cover"
                            />
                        </Pressable>
                    </Link>
                )}
            />

            {/* Movie Info Section */}
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {activeMovie?.name}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    {activeMovie?.origin_name}
                </Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <Link href={`/player/${activeMovie?.slug}`} asChild>
                        <Pressable style={styles.playButton}>
                            <Ionicons name="play" size={20} color="black" />
                            <Text style={styles.playButtonText}>Xem Phim</Text>
                        </Pressable>
                    </Link>

                    <Link href={`/movie/${activeMovie?.slug}`} asChild>
                        <Pressable style={styles.infoButton}>
                            <Ionicons name="information-circle" size={20} color="black" />
                            <Text style={styles.infoButtonText}>Thông tin</Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Meta Tags */}
                <View style={styles.metaRow}>
                    <View style={styles.imdbTag}>
                        <Text style={styles.imdbText}>IMDb 8.5</Text>
                    </View>
                    <View style={styles.metaTag}>
                        <Text style={styles.metaText}>T16</Text>
                    </View>
                    <View style={styles.metaTag}>
                        <Text style={styles.metaText}>{activeMovie?.year}</Text>
                    </View>
                    <View style={styles.metaTag}>
                        <Text style={styles.metaText}>{activeMovie?.quality?.includes('FHD') ? 'FHD' : activeMovie?.quality}</Text>
                    </View>
                    {activeMovie?.episode_current && (
                        <View style={styles.metaTag}>
                            <Text style={styles.metaText}>{activeMovie?.episode_current}</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={3}>
                    {activeMovie?.content?.replace(/<[^>]*>/g, '')}
                </Text>

                {/* Dots Indicator */}
                <View style={styles.dotsRow}>
                    {movies.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.3)', width: i === activeIndex ? 24 : 6 }
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
        height: height * 0.85, // Takes up most of the screen
        position: 'relative',
    },
    posterWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1f2937',
        shadowColor: "#fbbf24", // Gold shadow for warmth
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, // Soft glow
        shadowRadius: 20,
        elevation: 10,
    },
    posterImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    playButton: {
        backgroundColor: '#fbbf24', // Amber-400
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: BUTTON_WIDTH,
        justifyContent: 'center',
        height: 48,
    },
    playButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    infoButton: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: BUTTON_WIDTH,
        justifyContent: 'center',
        height: 48,
    },
    infoButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    imdbTag: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    imdbText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12,
    },
    metaTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    metaText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 10,
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
});

