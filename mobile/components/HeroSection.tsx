import { View, Text, Dimensions, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { Movie, getImageUrl } from '@/services/api';

const { width } = Dimensions.get('window');
const HEIGHT = width * 1.35; // Taller hero for more impact

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    if (!movies.length) return null;

    return (
        <View style={{ height: HEIGHT }}>
            <Carousel
                loop
                width={width}
                height={HEIGHT}
                autoPlay={true}
                data={movies}
                scrollAnimationDuration={1000}
                renderItem={({ item }) => (
                    <Link href={`/movie/${item.slug}`} asChild>
                        <Pressable style={{ flex: 1, position: 'relative' }}>
                            <Image
                                source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                            />

                            {/* Gradient Overlay */}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                                locations={[0, 0.3, 0.6, 1]}
                                style={StyleSheet.absoluteFillObject}
                            />

                            {/* Content */}
                            <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 z-10 items-center">
                                {/* Title */}
                                <Text className="text-white text-3xl font-extrabold mb-2 text-center shadow-md leading-tight tracking-tight">
                                    {item.name}
                                </Text>
                                <Text className="text-gray-300 text-sm font-medium mb-4 text-center">
                                    {item.origin_name}
                                </Text>

                                {/* Metadata Tags */}
                                <View className="flex-row items-center gap-3 mb-6">
                                    <View className="bg-yellow-500/20 border border-yellow-500/50 px-2 py-0.5 rounded">
                                        <Text className="text-yellow-500 font-bold text-[10px]">IMDb 8.5</Text>
                                    </View>
                                    <View className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                                        <Text className="text-gray-300 font-bold text-[10px]">4K</Text>
                                    </View>
                                    <View className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                                        <Text className="text-gray-300 font-bold text-[10px]">{item.quality || 'HD'}</Text>
                                    </View>
                                    <View className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                                        <Text className="text-gray-300 font-bold text-[10px]">{item.year}</Text>
                                    </View>
                                </View>

                                {/* Buttons Row */}
                                <View className="flex-row gap-4 w-full px-2">
                                    <View className="flex-1 bg-[#fbbf24] py-3.5 rounded-xl flex-row justify-center items-center shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">
                                        <Ionicons name="play" size={22} color="black" />
                                        <Text className="text-black font-extrabold text-lg ml-2">Xem Phim</Text>
                                    </View>
                                    <View className="flex-1 bg-white/20 backdrop-blur-md py-3.5 rounded-xl flex-row justify-center items-center border border-white/10 active:scale-95 transition-transform">
                                        <Ionicons name="information-circle-outline" size={24} color="white" />
                                        <Text className="text-white font-bold text-lg ml-2">Thông tin</Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    </Link>
                )}
            />
        </View>
    );
}

