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

                {/* Badge: PD/TM + Ep */}
                <View className="absolute bottom-2 left-2 flex-row gap-1">
                    {/* Logic: TM (Blue) vs PD (Gray) */}
                    {movie.lang?.includes('Thuyết') ? (
                        <View className="bg-blue-500/90 px-1.5 py-0.5 rounded-md shadow-sm">
                            <Text className="text-[10px] font-bold text-white">
                                TM.<Text className="text-white">{movie.episode_current?.replace(/[^0-9]/g, '') || '?'}</Text>
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-gray-600/90 px-1.5 py-0.5 rounded-md shadow-sm">
                            <Text className="text-[10px] font-bold text-white">
                                PD.<Text className="text-white">{movie.episode_current?.replace(/[^0-9]/g, '') || '?'}</Text>
                            </Text>
                        </View>
                    )}
                </View>

                {/* Quality Badge (Optional - Top Right) */}
                {movie.quality && (
                    <View className="absolute top-2 right-2 bg-[#fbbf24] px-1.5 py-0.5 rounded-md shadow-sm">
                        <Text className="text-[9px] font-bold text-black">{movie.quality.replace('FHD', 'FHD')}</Text>
                    </View>
                )}

                {/* Title Section - Vertical Layout */}
                <View className="mt-2">
                    <Text
                        className="text-white text-[12px] font-bold leading-tight"
                        numberOfLines={1}
                        style={{ fontFamily: 'System' }}
                    >
                        {movie.name}
                    </Text>
                    <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>
                        {movie.origin_name}
                    </Text>
                </View>
            </Pressable>
        </Link>
    );
});

export default MovieCard;
