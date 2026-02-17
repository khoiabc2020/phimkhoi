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
        <View style={{ height: height * 0.85, position: 'relative' }}>
            {/* Background Blur */}
            <View style={StyleSheet.absoluteFill}>
                <Image
                    source={{ uri: getImageUrl(activeMovie?.poster_url || activeMovie?.thumb_url) }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={30}
                />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                <LinearGradient
                    colors={['transparent', '#000']}
                    style={StyleSheet.absoluteFill}
                    locations={[0.4, 1]}
                />
            </View>

            {/* Vertical Carousel */}
            <View style={{ marginTop: 100 }}>
                <Carousel
                    loop={true}
                    width={width}
                    height={ITEM_HEIGHT}
                    autoPlay={false} // Disable autoplay for better UX on vertical focus
                    data={movies}
                    mode="parallax"
                    modeConfig={{
                        parallaxScrollingScale: 0.9,
                        parallaxScrollingOffset: 50,
                    }}
                    onSnapToItem={(index) => setActiveIndex(index)}
                    renderItem={({ item }) => (
                        <Link href={`/movie/${item.slug}`} asChild>
                            <Pressable style={{ flex: 1, width: ITEM_WIDTH, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } }}>
                                <Image
                                    source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={{ position: 'absolute', bottom: 20, width: '100%', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', fontFamily: 'serif' }}>
                                        {item.name}
                                    </Text>
                                    <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4, fontFamily: 'serif' }}>
                                        {item.origin_name}
                                    </Text>
                                </View>
                            </Pressable>
                        </Link>
                    )}
                />
            </View>

            {/* Metadata & Actions (Below Carousel) */}
            <View style={{ alignItems: 'center', paddingHorizontal: 20, marginTop: 20 }}>
                {/* Title (Large) */}
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 5 }}>
                    {activeMovie?.name}
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                    {activeMovie?.origin_name}
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20, width: '100%' }}>
                    <Link href={`/movie/${activeMovie?.slug}`} asChild>
                        <Pressable style={{ flex: 1, backgroundColor: '#fbbf24', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="play" size={20} color="black" />
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Xem Phim</Text>
                        </Pressable>
                    </Link>
                    <Link href={`/movie/${activeMovie?.slug}`} asChild>
                        <Pressable style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="information-circle" size={20} color="black" />
                            <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Thông tin</Text>
                        </Pressable>
                    </Link>
                </View>

                {/* Tags Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#fbbf24' }}>
                        <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 12 }}>IMDb 8.4</Text>
                    </View>
                    <View style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>T16</Text>
                    </View>
                    <View style={{ backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#374151' }}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>{activeMovie?.year}</Text>
                    </View>
                    <View style={{ backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#374151' }}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>{activeMovie?.quality || 'Full HD'}</Text>
                    </View>
                </View>

                {/* Description Preview */}
                <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 20, lineHeight: 20 }} numberOfLines={2}>
                    {activeMovie?.content?.replace(/<[^>]*>/g, '')}
                </Text>

                {/* Dots Indicator */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 20 }}>
                    {movies.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.3)'
                            }}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

