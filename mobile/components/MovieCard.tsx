import React, { memo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Movie, getImageUrl } from '@/services/api';
import FocusableButton from './FocusableButton';

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
}

const MovieCard = memo(({ movie, width: propsWidth, height: propsHeight }: MovieCardProps) => {
    const { width: windowWidth } = useWindowDimensions();
    const isTablet = windowWidth >= 768;

    // Tính toán Width động tối ưu
    const targetCols = isTablet ? Math.floor(windowWidth / 140) : 3;
    const padding = isTablet ? 110 : 32; // Tablet trừ hao Sidebar 90px + margin
    const dynamicWidth = propsWidth || Math.floor((windowWidth - padding - (targetCols - 1) * 10) / targetCols);
    const dynamicHeight = propsHeight || (dynamicWidth * 1.5);

    if (!movie || !movie.slug) return null;
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    return (
        <Link href={`/movie/${movie.slug}`} asChild>
            <FocusableButton
                className="mr-3 transition-opacity"
                style={{ width: dynamicWidth, borderRadius: 14, padding: 2 }}
                focusStyle={{ borderWidth: 2, borderColor: '#fbbf24', transform: [{ scale: 1.05 }] }}
            >
                <View style={{ width: dynamicWidth, height: dynamicHeight, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width: dynamicWidth, height: dynamicHeight }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />

                    {(movie.episode_current != null && String(movie.episode_current).trim() !== '') && (
                        <View style={{ position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 4 }}>
                            {movie.lang?.includes('Thuyết') ? (
                                <View style={{ backgroundColor: 'rgba(59,130,246,0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white' }}>
                                        TM.{String(movie.episode_current).replace(/[^0-9]/g, '') || 'Full'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ backgroundColor: 'rgba(75,85,99,0.9)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white' }}>
                                        PD.{String(movie.episode_current).replace(/[^0-9]/g, '') || 'Full'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {movie.quality && (
                        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#fbbf24', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'black' }}>{movie.quality}</Text>
                        </View>
                    )}
                </View>

                <View style={{ marginTop: 6 }}>
                    <Text
                        style={{ color: 'white', fontSize: 12, fontWeight: '700', lineHeight: 16 }}
                        numberOfLines={1}
                    >
                        {movie.name}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                        {movie.origin_name}
                    </Text>
                </View>
            </FocusableButton>
        </Link>
    );
});

export default MovieCard;
