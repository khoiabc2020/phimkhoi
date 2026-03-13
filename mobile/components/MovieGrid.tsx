import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, useWindowDimensions } from 'react-native';
import MovieCard from './MovieCard';
import Skeleton from './Skeleton';
import { Movie } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

const GAP = 16;
const PADDING = 16;
const MIN_CARD_WIDTH = 140;

interface MovieGridProps {
    movies: Movie[];
    loading?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    onEndReached?: () => void;
    loadingMore?: boolean;
    ListHeaderComponent?: React.ReactElement | null;
    emptyText?: string;
}

export default function MovieGrid({
    movies,
    loading,
    refreshing,
    onRefresh,
    onEndReached,
    loadingMore,
    ListHeaderComponent,
    emptyText = "Không tìm thấy phim"
}: MovieGridProps) {
    const { width } = useWindowDimensions();
    const layout = useMemo(() => {
        const safeW = Math.max(320, width || 0);
        const contentW = safeW - PADDING * 2;
        const cols = Math.max(2, Math.min(6, Math.floor((contentW + GAP) / (MIN_CARD_WIDTH + GAP))));
        const cardW = Math.floor((contentW - GAP * (cols - 1)) / cols);
        return { cols, cardW };
    }, [width]);

    if (loading && movies.length === 0) {
        return (
            <View className="flex-1 px-4 pt-4">
                {ListHeaderComponent}
                <View className="flex-row flex-wrap justify-between">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <View key={i} style={{ width: layout.cardW, marginBottom: 16 }}>
                            <Skeleton width="100%" height={layout.cardW * 1.5} borderRadius={12} />
                            <View className="mt-2">
                                <Skeleton width="80%" height={16} borderRadius={4} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, height: '100%', width: '100%' }}>
            <FlashList
                data={movies}
                numColumns={layout.cols}
                estimatedItemSize={250}
                keyExtractor={(item) => item._id || item.slug} // Fallback to slug if _id missing
                contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 }}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="film-outline" size={64} color="#4b5563" />
                        <Text className="text-gray-400 mt-4 text-center">{emptyText}</Text>
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? (
                        <View className="py-4 items-center">
                            <ActivityIndicator size="small" color="#fbbf24" />
                        </View>
                    ) : null
                }
                renderItem={({ item, index }) => (
                    <View
                        style={{
                            width: layout.cardW,
                            marginBottom: 16,
                            marginRight: (index % layout.cols) === (layout.cols - 1) ? 0 : GAP,
                        }}
                    >
                        <MovieCard movie={item} width={layout.cardW} height={layout.cardW * 1.5} />
                    </View>
                )}
            />
        </View>
    );
}
