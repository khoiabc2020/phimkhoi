import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Movie, getImageUrl } from '@/services/api';

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
}

const MovieCard = memo(({ movie, width = 115, height = 172 }: MovieCardProps) => {
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
                    cachePolicy="memory-disk"
                />

                {/* Left Badge: PD/TM + Episode */}
                {/* Logic: If lang contains 'Thuyết Minh' -> TM, 'Vietsub' -> PD, else 'VS' */}
                {/* Number: episode_current */}
                {/* Left Badge: PD/TM + Episode */}
                {/* Logic: If lang contains 'Thuyết Minh' -> TM, 'Vietsub' -> PD, else 'VS' */}
                {/* Number: episode_current */}
                <View className="absolute bottom-1 left-1 flex-row gap-1">
                    <View className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
                        <Text className="text-[9px] font-bold text-white">
                            {movie.lang?.includes('Thuyết') ? 'TM' : 'PD'}
                            <Text className="text-yellow-400">.{movie.episode_current?.replace(/[^0-9]/g, '') || '?'}</Text>
                        </Text>
                    </View>
                </View>

                {/* Right Badge: Quality (Optional, keep for clarity but maybe smaller) */}
                {movie.quality && (
                    <View className="absolute top-1 right-1 bg-yellow-500 rounded px-1.5 py-0.5 shadow-sm">
                        <Text className="text-[9px] font-bold text-black">{movie.quality.replace('FHD', 'FHD')}</Text>
                    </View>
                )}

                {/* Title */}
                <Text
                    className="text-white text-[10px] font-bold mt-2 leading-tight"
                    numberOfLines={1}
                    style={{ fontFamily: 'System' }}
                >
                    {movie.name}
                </Text>
                <Text className="text-gray-500 text-[10px] mt-0.5" numberOfLines={1}>
                    {movie.origin_name}
                </Text>
            </Pressable>
        </Link>
    );
});

export default MovieCard;
