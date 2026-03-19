import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Movie, getImageUrl, prefetchMovieDetail } from '@/services/api';
import FocusableButton from './FocusableButton';

// Default card size – MovieRow overrides these with computed values
const DEFAULT_CARD_WIDTH = 110;
const DEFAULT_CARD_HEIGHT = 165;

interface MovieCardProps {
    movie: Movie;
    width?: number;
    height?: number;
}

const MovieCard = memo(({ movie, width: propsWidth, height: propsHeight }: MovieCardProps) => {
    // Dimensions are computed ONCE per MovieRow (not per card) to avoid mass re-renders
    const dynamicWidth = propsWidth ?? DEFAULT_CARD_WIDTH;
    const dynamicHeight = propsHeight ?? DEFAULT_CARD_HEIGHT;

    if (!movie || !movie.slug) return null;
    const usesThumbFallbackInPortrait = !movie.poster_url && !!movie.thumb_url;
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    return (
        <Link href={`/movie/${movie.slug}`} asChild>
            <FocusableButton
                className="mr-3 transition-opacity"
                style={{ width: dynamicWidth, borderRadius: 14, padding: 2 }}
                focusStyle={{ borderWidth: 2, borderColor: '#E50914', transform: [{ scale: 1.05 }] }}
                onPressIn={() => {
                    prefetchMovieDetail(movie.slug);
                }}
            >
                <View
                    style={{
                        width: dynamicWidth,
                        height: dynamicHeight,
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: usesThumbFallbackInPortrait ? '#0a0f1a' : 'transparent',
                    }}
                >
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width: dynamicWidth, height: dynamicHeight }}
                        contentFit={usesThumbFallbackInPortrait ? "contain" : "cover"}
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
                        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#263243', borderWidth: 1, borderColor: '#33455F', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#d8e3f2' }}>{movie.quality}</Text>
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
