import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '@/services/api';
import MovieCard from './MovieCard';
import { FlashList } from '@shopify/flash-list';
import { memo } from 'react';

interface MovieRowProps {
    title: string;
    movies: Movie[];
}

const MovieRow = memo(({ title, movies }: MovieRowProps) => {
    if (!movies || movies.length === 0) return null;

    return (
        <View className="mb-6 w-full h-[280px]">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <Link href={`/list/${title === 'Phim lẻ' ? 'phim-le' : 'phim-bo'}`} asChild>
                    <Pressable className="p-1">
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </Pressable>
                </Link>
            </View>

            {/* List */}
            <FlashList
                data={movies}
                renderItem={({ item }) => <MovieCard movie={item} />}
                estimatedItemSize={140}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
});

export default MovieRow;
