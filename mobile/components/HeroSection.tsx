import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Dimensions, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie, getImageUrl } from '@/services/api';

const { width } = Dimensions.get('window');
const HEIGHT = width * 1.35; // Taller hero for more impact

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();

    // Auto-play
    useEffect(() => {
        if (movies.length <= 1) return;
        const interval = setInterval(() => {
            if (activeIndex < movies.length - 1) {
                flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
            } else {
                flatListRef.current?.scrollToIndex({ index: 0 });
            }
        }, 8000); // Slower cycle for better viewing
        return () => clearInterval(interval);
    }, [activeIndex, movies.length]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    if (!movies || movies.length === 0) return null;

    const renderItem = ({ item }: { item: Movie }) => {
        const imageUrl = getImageUrl(item.thumb_url || item.poster_url);

        return (
            <View style={{ width, height: HEIGHT }}>
                <Image
                    source={{ uri: imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
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

                    {/* Buttons */}
                    <View className="flex-row gap-4 w-full px-4">
                        <Link href={`/player/${item.slug}`} asChild>
                            <Pressable className="bg-yellow-500 flex-1 py-3.5 rounded-xl flex-row justify-center items-center active:scale-95 transition-transform shadow-lg shadow-yellow-500/20">
                                <Ionicons name="play" size={22} color="black" />
                                <Text className="text-black font-extrabold text-base ml-2">Xem Phim</Text>
                            </Pressable>
                        </Link>

                        <Link href={`/movie/${item.slug}`} asChild>
                            <Pressable className="bg-white flex-1 py-3.5 rounded-xl flex-row justify-center items-center active:scale-95 transition-transform shadow-lg">
                                <Ionicons name="information-circle" size={24} color="black" />
                                <Text className="text-black font-extrabold text-base ml-2">Thông tin</Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="relative">
            <FlatList
                ref={flatListRef}
                data={movies}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                keyExtractor={(item) => item._id}
                scrollEventThrottle={16}
            />

            {/* Pagination Dots */}
            <View className="absolute bottom-28 w-full flex-row justify-center gap-2 z-20">
                {movies.map((_, index) => (
                    <View
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'bg-yellow-500 w-6' : 'bg-gray-500/50 w-1.5'}`}
                    />
                ))}
            </View>
        </View>
    );
}
