import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { getFavorites, removeFavorite, FavoriteMovie } from '@/lib/favorites';
import MovieCard from '@/components/MovieCard';
import { StatusBar } from 'expo-status-bar';
import { Dimensions } from 'react-native';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 3) / 2;

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, syncFavorites } = useAuth();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (user && token) {
      // Load from API
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setFavorites(data.favorites);
          // Also sync context
          syncFavorites();
        }
      } catch (e) {
        console.error("Failed to load favorites from API", e);
      }
    } else {
      // Load local
      const list = await getFavorites();
      setFavorites(list);
    }
  }, [user, token]);

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

  const handleRemove = async (movieId: string, slug: string) => {
    if (user && token) {
      // Remove from API
      try {
        await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ slug })
        });
        setFavorites((prev) => prev.filter((m) => (m.movieSlug || m.slug) !== slug));
        syncFavorites();
      } catch (e) {
        console.error(e);
      }
    } else {
      // Remove local
      await removeFavorite(slug);
      setFavorites((prev) => prev.filter((m) => (m.movieSlug || m.slug) !== slug));
    }
  };

  if (favorites.length === 0) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <Ionicons name="heart-outline" size={64} color="#444" />
          <Text className="text-white text-xl font-bold mt-4 text-center">Chưa có phim yêu thích</Text>
          <Text className="text-gray-400 mt-2 text-center">Thêm phim từ trang chi tiết phim</Text>
          <Link href="/(tabs)/explore" asChild>
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
          keyExtractor={(item, index) => item.movieId || item._id || String(index)}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />}
          renderItem={({ item }) => {
            const slug = item.movieSlug || item.slug;
            return (
              <View style={{ width: CARD_WIDTH }}>
                <View className="relative">
                  <MovieCard
                    movie={{
                      _id: item.movieId || item._id || '',
                      name: item.movieName || item.name || '',
                      slug: slug || '',
                      origin_name: item.movieOriginName || item.name || '',
                      thumb_url: item.moviePoster || item.thumb_url || item.poster_url || '',
                      poster_url: item.moviePoster || item.poster_url || item.thumb_url || '',
                      year: item.movieYear || 0,
                      quality: item.movieQuality || 'HD',
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
                      lang: '',
                      notify: '',
                      showtimes: '',
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
                    onPress={() => handleRemove(item.movieId || item._id || '', slug || '')}
                    className="absolute top-1 left-1 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                  >
                    <Ionicons name="heart" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
