import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Dimensions, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie, getImageUrl } from '@/services/api';

const { width } = Dimensions.get('window');
const HEIGHT = width * 1.2; // 4:5 Aspect Ratio for Hero

interface HeroSectionProps {
    movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Auto-play
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeIndex < movies.length - 1) {
                flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
            } else {
                flatListRef.current?.scrollToIndex({ index: 0 });
            }
        }, 5000);
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
                    colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.95)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Content */}
                <View className="absolute bottom-12 left-4 right-4 z-10">
                    {/* Badges */}
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="bg-yellow-500 px-2 py-0.5 rounded">
                            <Text className="text-black font-bold text-xs">FHD</Text>
                        </View>
                        <Text className="text-gray-300 text-xs font-medium">{item.quality} • {item.lang}</Text>
                    </View>

                    {/* Title */}
                    <Text className="text-white text-3xl font-bold mb-1 shadow-sm" numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text className="text-gray-300 text-base font-medium mb-4" numberOfLines={1}>
                        {item.origin_name} ({item.year})
                    </Text>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        <Link href={`/movie/${item.slug}`} asChild>
                            <Pressable className="bg-yellow-500 flex-1 py-3 rounded-full flex-row justify-center items-center active:bg-yellow-600">
                                <Ionicons name="play" size={20} color="black" />
                                <Text className="text-black font-bold text-base ml-1">Xem Ngay</Text>
                            </Pressable>
                        </Link>

                        <Pressable className="bg-white/20 flex-1 py-3 rounded-full flex-row justify-center items-center backdrop-blur-md active:bg-white/30">
                            <Ionicons name="add" size={24} color="white" />
                            <Text className="text-white font-bold text-base ml-1">Danh sách</Text>
                        </Pressable>
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
            />

            {/* Pagination Dots */}
            <View className="absolute bottom-4 flex-row justify-center w-full gap-1.5">
                {movies.map((_, index) => (
                    <View
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'bg-yellow-500 w-4' : 'bg-gray-600 w-1.5'}`}
                    />
                ))}
            </View>
        </View>
    );
}
