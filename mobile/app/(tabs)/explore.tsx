import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getMenuData, searchMovies, Movie } from '@/services/api';
import MovieCard from '@/components/MovieCard';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 16 * 3) / 2; // padding + gap

const LIST_TYPES = [
  { slug: 'phim-le', label: 'Phim Lẻ' },
  { slug: 'phim-bo', label: 'Phim Bộ' },
  { slug: 'tv-shows', label: 'TV Shows' },
  { slug: 'hoat-hinh', label: 'Hoạt Hình' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    getMenuData().then(({ categories: c, countries: co }) => {
      setCategories(c);
      setCountries(co);
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchMovies(search.trim());
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Search */}
        <View className="px-4 pt-2 pb-4">
          <View className="flex-row items-center bg-gray-900 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm phim..."
              placeholderTextColor="#6b7280"
              className="flex-1 ml-3 text-white text-base"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {search.length > 0 ? (
          /* Search Results */
          <View className="flex-1 px-4">
            {searching ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#fbbf24" />
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                numColumns={2}
                keyExtractor={(item) => item._id}
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <View style={{ width: CARD_WIDTH }}>
                    <MovieCard movie={item} width={CARD_WIDTH} height={CARD_WIDTH * 1.4} />
                  </View>
                )}
              />
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-400">Không tìm thấy phim</Text>
              </View>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Quick Links */}
            <View className="px-4 mb-6">
              <Text className="text-white text-lg font-bold mb-3">Danh mục</Text>
              <View className="flex-row flex-wrap gap-2">
                {LIST_TYPES.map((item) => (
                  <Link key={item.slug} href={`/list/${item.slug}`} asChild>
                    <Pressable className="bg-gray-800 px-4 py-2 rounded-full active:bg-gray-700">
                      <Text className="text-white font-medium">{item.label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>

            {/* Categories */}
            {categories.length > 0 && (
              <View className="px-4 mb-6">
                <Text className="text-white text-lg font-bold mb-3">Thể loại</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.slice(0, 12).map((c: any) => (
                    <Link key={c.slug} href={`/category/${c.slug}`} asChild>
                      <Pressable className="bg-gray-800 px-4 py-2 rounded-full active:bg-gray-700">
                        <Text className="text-white font-medium">{c.name}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            )}

            {/* Countries */}
            {countries.length > 0 && (
              <View className="px-4 mb-6">
                <Text className="text-white text-lg font-bold mb-3">Quốc gia</Text>
                <View className="flex-row flex-wrap gap-2">
                  {countries.slice(0, 10).map((c: any) => (
                    <Link key={c.slug} href={`/country/${c.slug}`} asChild>
                      <Pressable className="bg-gray-800 px-4 py-2 rounded-full active:bg-gray-700">
                        <Text className="text-white font-medium">{c.name}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
