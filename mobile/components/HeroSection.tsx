import { View, Text, Dimensions, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Movie, getImageUrl } from '@/services/api';
import { BlurView } from 'expo-blur';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.72;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;
const SPACER = (width - ITEM_WIDTH) / 2;

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!movies.length) return null;

    const activeMovie = movies[activeIndex];

    return (
        <View style={{ height: height * 0.82, position: 'relative' }}>
            {/* Background Blur (Subtle) */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.poster_url || activeMovie?.thumb_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={40} // Increased blur for softer background
                />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                    style={StyleSheet.absoluteFill}
                    locations={[0.5, 0.8, 1]}
                />
            </View>

            {/* Vertical Carousel - Centered Poster */}
            <View style={{ marginTop: 80, alignItems: 'center' }}>
                <Carousel
                    loop={true}
                    width={width}
                    height={ITEM_HEIGHT}
                    autoPlay={false}
                    data={movies}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.85,
                        parallaxScrollingOffset: 60,
                    }}
                    onSnapToItem={(index) => setActiveIndex(index)}
                    renderItem={({ item }) => (
                        <Link href={`/movie/${item.slug}`} asChild>
                            <Pressable style={styles.posterContainer}>
                                <Image
                                    source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                    style={styles.posterImage}
                                    resizeMode="cover"
                                />
                                {/* No overlay on the poster itself - Let it shine */}
                            </Pressable>
                        </Link>
                    )}
                />
            </View>

            {/* Content Info (Clean & Elegant) */}
            <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 24 }}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {activeMovie?.name}
                </Text>
                <Text style={styles.subtitle}>
                    {activeMovie?.origin_name}
                </Text>

                {/* Buttons Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' }}>
                    <Link href={`/movie/${activeMovie?.slug}`} asChild>
                        <Pressable style={styles.playButton}>
                            <Ionicons name="play" size={22} color="black" />
                            <Text style={styles.playButtonText}>Xem Phim</Text>
                        </Pressable>
                    </Link>
                    <Link href={`/movie/${activeMovie?.slug}`} asChild>
                        <Pressable style={styles.infoButton}>
                            <Ionicons name="information-circle-outline" size={24} color="black" />
                            <Text style={styles.infoButtonText}>Thông tin</Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Metadata Tags (Minimalist) */}
                <View style={styles.metaContainer}>
                    <View style={styles.imdbTag}>
                        <Text style={styles.imdbText}>IMDb 8.5</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>T16</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{activeMovie?.year}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{activeMovie?.quality?.includes('FHD') ? 'FHD' : activeMovie?.quality}</Text>
                    </View>
                    {activeMovie?.episode_current && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{activeMovie?.episode_current}</Text>
                        </View>
                    )}
                </View>

                {/* Description Preview */}
                <Text style={styles.description} numberOfLines={2}>
                    {activeMovie?.content?.replace(/<[^>]*>/g, '')}
                </Text>

                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {movies.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.2)' }
                            ]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    posterContainer: {
        flex: 1,
        width: ITEM_WIDTH,
        alignSelf: 'center',
        borderRadius: 18,
        overflow: 'hidden',
        // Shadow for "floating" effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    posterImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'serif', // Elegant font approach
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        textAlign: 'center',
        marginTop: 4,
        fontFamily: 'serif'
    },
    playButton: {
        flex: 1,
        backgroundColor: '#fbbf24',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    playButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8
    },
    infoButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16
    },
    imdbTag: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    imdbText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    tagText: {
        color: '#e5e7eb',
        fontWeight: '600',
        fontSize: 12
    },
    description: {
        color: '#9ca3af',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
        paddingHorizontal: 10
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 20
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    }
});

