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

    if (!movie.slug) return null;

    return (
        <Link href={`/movie/${movie.slug}`} asChild>
            <Pressable
                className="mr-3 active:opacity-80 transition-opacity"
                style={{ width }}
            >
                {/* Image + Overlay Badges */}
                <View style={{
                    width,
                    height,
                    borderRadius: 18, // User Spec: 18dp
                    overflow: 'hidden',
                    position: 'relative',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: '#15171E',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4
                }}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={{ width, height }}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                    />

                    {/* Badge: PD/TM + Ep - Glass Style */}
                    <View style={{ position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', gap: 4 }}>
                        {movie.lang?.includes('Thuyết') ? (
                            <View style={{
                                backgroundColor: 'rgba(15,18,26,0.85)',
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 6,
                                borderWidth: 0.5,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: 'white' }}>
                                    TM.{movie.episode_current?.replace(/[^0-9]/g, '') || '?'}
                                </Text>
                            </View>
                        ) : (
                            <View style={{
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 6,
                                borderWidth: 0.5,
                                borderColor: 'rgba(255,255,255,0.2)'
                            }}>
                                <Text style={{ fontSize: 9, fontWeight: '700', color: 'white' }}>
                                    PD.{movie.episode_current?.replace(/[^0-9]/g, '') || '?'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Quality Badge - Top Right */}
                    {movie.quality && (
                        <View style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            backgroundColor: '#F4C84A', // Accent
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 6,
                            shadowColor: '#F4C84A',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                        }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: 'black' }}>{movie.quality}</Text>
                        </View>
                    )}
                </View>

                {/* Title Section */}
                <View style={{ marginTop: 8, paddingHorizontal: 2 }}>
                    <Text
                        style={{ color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600', lineHeight: 18 }}
                        numberOfLines={1}
                    >
                        {movie.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                        {movie.origin_name}
                    </Text>
                </View>
            </Pressable>
        </Link>
    );
});

export default MovieCard;
