import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { getFavorites, removeFavorite, FavoriteMovie } from '@/lib/favorites';
import MovieCard from '@/components/MovieCard';
import { StatusBar } from 'expo-status-bar';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 3) / 2;

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getFavorites();
    setFavorites(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRemove = async (movieId: string) => {
    await removeFavorite(movieId);
    setFavorites((prev) => prev.filter((m) => m._id !== movieId));
  };

  if (favorites.length === 0) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={64} color="#444" />
          <Text className="text-white text-xl font-bold mt-4 text-center">Chưa có phim yêu thích</Text>
          <Text className="text-gray-400 mt-2 text-center">Thêm phim từ trang chi tiết phim</Text>
          <Link href="/explore" asChild>
            <Pressable className="mt-6 bg-yellow-500 px-6 py-3 rounded-full">
              <Text className="text-black font-bold">Khám phá phim</Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-4 pt-2 pb-4">
          <Text className="text-white text-xl font-bold">Yêu thích ({favorites.length})</Text>
        </View>
        <FlatList
          data={favorites}
          numColumns={2}
          keyExtractor={(item) => item._id}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH }}>
              <View className="relative">
                <MovieCard
                  movie={{
                    ...item,
                    origin_name: '',
                    content: '',
                    type: '',
                    status: '',
                    is_copyright: false,
                    sub_docquyen: false,
                    chieurap: false,
                    trailer_url: '',
                    time: '',
                    episode_current: '',
                    episode_total: '',
                    quality: 'HD',
                    lang: '',
                    notify: '',
                    showtimes: '',
                    year: 0,
                    view: 0,
                    actor: [],
                    director: [],
                    category: [],
                    country: [],
                    episodes: [],
                  }}
                  width={CARD_WIDTH}
                  height={CARD_WIDTH * 1.4}
                />
                <Pressable
                  onPress={() => handleRemove(item._id)}
                  className="absolute top-1 left-1 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                >
                  <Ionicons name="heart" size={18} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
