import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '@/services/api';
import MovieCard from './MovieCard';
import { FlashList } from '@shopify/flash-list';

interface MovieRowProps {
    title: string;
    movies: Movie[];
}

export default function MovieRow({ title, movies }: MovieRowProps) {
    if (!movies || movies.length === 0) return null;

    return (
        <View className="mb-6 w-full h-[280px]">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <Link href="/explore" asChild>
                    <Text className="text-yellow-500 text-xs font-bold">Xem tất cả</Text>
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
}
