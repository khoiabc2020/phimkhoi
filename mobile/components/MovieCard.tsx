import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Movie, getImageUrl } from '@/services/api';

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
}

export default function MovieCard({ movie, width = 140, height = 210 }: MovieCardProps) {
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    return (
        <Link href={`/movie/${movie.slug}`} asChild>
            <Pressable
                className="mr-3 active:opacity-80 transition-opacity"
                style={{ width }}
            >
                <Image
                    source={{ uri: imageUrl }}
                    style={{ width, height, borderRadius: 8 }}
                    contentFit="cover"
                    transition={200}
                />

                {/* Quality Badge */}
                <View className="absolute top-1 right-1 bg-yellow-500 rounded px-1.5 py-0.5 shadow-sm">
                    <Text className="text-[10px] font-bold text-black">{movie.quality || 'HD'}</Text>
                </View>

                {/* Title */}
                <Text className="text-white text-sm font-medium mt-2" numberOfLines={1}>
                    {movie.name}
                </Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                    {movie.origin_name}
                </Text>
            </Pressable>
        </Link>
    );
}
