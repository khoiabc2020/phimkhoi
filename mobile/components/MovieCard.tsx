import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Movie, getImageUrl } from '@/services/api';
import FocusableButton from './FocusableButton';

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
}

const MovieCard = memo(({ movie, width = 115, height = 172 }: MovieCardProps) => {
    if (!movie || !movie.slug) return null;
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    return (
        <Link href={`/movie/${movie.slug}`} asChild>
            <FocusableButton
                className="mr-3 transition-opacity"
                style={{ width, borderRadius: 8, padding: 2 }}
                focusStyle={{ borderWidth: 2, borderColor: '#fbbf24', transform: [{ scale: 1.05 }] }}
            >
                {/* Image + Overlay Badges */}
                <View style={{ width, height, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width, height }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />

                    {/* Badge: PD/TM + Ep - Ẩn khi không có số tập, phim lẻ hiển thị "Full" */}
                    {(movie.episode_current != null && String(movie.episode_current).trim() !== '') && (
                        <View style={{ position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 4 }}>
                            {movie.lang?.includes('Thuyết') ? (
                                <View style={{ backgroundColor: 'rgba(59,130,246,0.9)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white' }}>
                                        TM.{String(movie.episode_current).replace(/[^0-9]/g, '') || 'Full'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ backgroundColor: 'rgba(75,85,99,0.9)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white' }}>
                                        PD.{String(movie.episode_current).replace(/[^0-9]/g, '') || 'Full'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Quality Badge - Inside image, top-right */}
                    {movie.quality && (
                        <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#fbbf24', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'black' }}>{movie.quality}</Text>
                        </View>
                    )}
                </View>

                {/* Title Section */}
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
