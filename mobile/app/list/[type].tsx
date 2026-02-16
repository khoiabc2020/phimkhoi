import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { getMoviesList, Movie } from '@/services/api';
import MovieGrid from '@/components/MovieGrid';
import { StatusBar } from 'expo-status-bar';

const TYPE_LABELS: Record<string, string> = {
  'phim-le': 'Phim Lẻ',
  'phim-bo': 'Phim Bộ',
  'hoat-hinh': 'Hoạt Hình',
  'tv-shows': 'TV Shows',
};

export default function ListScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (pageNum: number, shouldRefresh = false) => {
    if (!type) return;
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const { items, pagination } = await getMoviesList(type, pageNum, 24);

      if (shouldRefresh || pageNum === 1) {
        setMovies(items);
      } else {
        setMovies(prev => [...prev, ...items]);
      }

      setHasMore(items.length > 0 && pagination.currentPage < pagination.totalPages);
    } catch (error) {
      console.error("Failed to load list", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => {
    setPage(1);
    loadData(1, true);
  }, [type]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData(1, true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage);
    }
  };

  if (!type) return null;

  const title = TYPE_LABELS[type] || type;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-12 pb-4 px-4 flex-row items-center bg-black/80 z-10">
        <Pressable onPress={() => router.back()} className="mr-3 p-2 -ml-2 rounded-full active:bg-gray-800">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-bold flex-1">
          {title}
        </Text>
      </View>

      <MovieGrid
        movies={movies}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        loadingMore={loadingMore}
        emptyText="Không tìm thấy phim"
      />
    </View>
  );
}
