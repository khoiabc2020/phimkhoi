import React from 'react';
import { View, FlatList, ActivityIndicator, Text, Dimensions } from 'react-native';
import MovieCard from './MovieCard';
import Skeleton from './Skeleton';
import { Movie } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
// Calculate card size consistent with other screens
// 3 gaps of 16px (left, middle, right) -> (width - 48) / 2
const GAP = 16;
const PADDING = 16;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

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

    if (loading && movies.length === 0) {
        return (
            <View className="flex-1 px-4 pt-4">
                {ListHeaderComponent}
                <View className="flex-row flex-wrap justify-between">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <View key={i} style={{ width: CARD_WIDTH, marginBottom: 16 }}>
                            <Skeleton width="100%" height={CARD_WIDTH * 1.5} borderRadius={12} />
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
        <FlatList
            data={movies}
            numColumns={2}
            keyExtractor={(item) => item._id || item.slug} // Fallback to slug if _id missing
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
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
            renderItem={({ item }) => (
                <View style={{ width: CARD_WIDTH }}>
                    <MovieCard movie={item} width={CARD_WIDTH} height={CARD_WIDTH * 1.5} />
                </View>
            )}
        />
    );
}
