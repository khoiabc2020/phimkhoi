import { View, Text, TextInput, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getMenuData, searchMovies, Movie } from '@/services/api';
import MovieGrid from '@/components/MovieGrid';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
// Calculate card size consistent with other screens

const LIST_TYPES = [
  { slug: 'phim-le', label: 'Phim Lẻ' },
  { slug: 'phim-bo', label: 'Phim Bộ' },
  { slug: 'tv-shows', label: 'TV Shows' },
  { slug: 'hoat-hinh', label: 'Hoạt Hình' },
];

export default function ExploreScreen() {
  const router = useRouter();
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
      // Search API doesn't support pagination well yet in this demo, so just fetching 20
      const results = await searchMovies(search.trim(), 20);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Search Input */}
        <View className="px-4 pt-2 pb-4 border-b border-gray-900 bg-black z-10">
          <View className="flex-row items-center bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 focus:border-yellow-500">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm tên phim, diễn viên..."
              placeholderTextColor="#6b7280"
              className="flex-1 ml-3 text-white text-base"
              autoCapitalize="none"
              returnKeyType="search"
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
          <MovieGrid
            movies={searchResults}
            loading={searching}
            emptyText={`Không tìm thấy phim cho "${search}"`}
          />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Quick Links */}
            <View className="px-4 py-6">
              <Text className="text-white text-lg font-bold mb-4">Danh mục</Text>
              <View className="flex-row flex-wrap gap-3">
                {LIST_TYPES.map((item) => (
                  <Link key={item.slug} href={`/list/${item.slug}`} asChild>
                    <Pressable className="bg-gray-800 px-5 py-3 rounded-xl active:bg-gray-700 min-w-[45%] flex-grow items-center">
                      <Text className="text-white font-bold">{item.label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>

            {/* Categories */}
            {categories.length > 0 && (
              <View className="px-4 mb-6">
                <Text className="text-white text-lg font-bold mb-4">Thể loại</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.slice(0, 16).map((c: any) => (
                    <Link key={c.slug} href={`/category/${c.slug}`} asChild>
                      <Pressable className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-full active:bg-gray-700">
                        <Text className="text-gray-300 font-medium text-sm">{c.name}</Text>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </View>
            )}

            {/* Countries */}
            {countries.length > 0 && (
              <View className="px-4 mb-6">
                <Text className="text-white text-lg font-bold mb-4">Quốc gia</Text>
                <View className="flex-row flex-wrap gap-2">
                  {countries.slice(0, 12).map((c: any) => (
                    <Link key={c.slug} href={`/country/${c.slug}`} asChild>
                      <Pressable className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-full active:bg-gray-700">
                        <Text className="text-gray-300 font-medium text-sm">{c.name}</Text>
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
