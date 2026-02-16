import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getMoviesList, Movie } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import { StatusBar } from 'expo-status-bar';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 3) / 2;

const TYPE_LABELS: Record<string, string> = {
  'phim-le': 'Phim Lẻ',
  'phim-bo': 'Phim Bộ',
  'hoat-hinh': 'Hoạt Hình',
  'tv-shows': 'TV Shows',
};

export default function ListScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    getMoviesList(type, 1, 24).then(({ items }) => {
      setMovies(items);
      setLoading(false);
    });
  }, [type]);

  if (!type) return null;

  const title = TYPE_LABELS[type] || type;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      <View className="pt-12 pb-4 px-4 flex-row items-center">
        <Link href="/explore" asChild>
          <Pressable className="mr-3 p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </Link>
        <Text className="text-white text-xl font-bold flex-1">{title}</Text>
      </View>
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fbbf24" />
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(item) => item._id}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <MovieCard movie={item} width={CARD_WIDTH} height={CARD_WIDTH * 1.4} />
            </View>
          )}
        />
      )}
    </View>
  );
}
