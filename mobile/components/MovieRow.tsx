import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '@/services/api';
import MovieCard from './MovieCard';

interface MovieRowProps {
    title: string;
    movies: Movie[];
}

export default function MovieRow({ title, movies }: MovieRowProps) {
    if (!movies || movies.length === 0) return null;

    return (
        <View className="mb-6">
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 mb-3">
                <Text className="text-white text-lg font-bold">{title}</Text>
                <Link href="/explore" asChild>
                    <Text className="text-yellow-500 text-xs font-bold">Xem tất cả</Text>
                </Link>
            </View>

            {/* List */}
            <FlatList
                data={movies}
                renderItem={({ item }) => <MovieCard movie={item} />}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
}
