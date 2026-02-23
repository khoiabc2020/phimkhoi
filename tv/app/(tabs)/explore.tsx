import { View, Text, TextInput, ScrollView, Pressable, Dimensions, Image as RNImage, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { searchMovies, Movie, getHomeData, getImageUrl } from '@/services/api';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SPACING = 10;
const ITEM_WIDTH = (width - 32 - (ITEM_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

const HotMovieItem = ({ item, index }: { item: Movie, index: number }) => {
  const isTop = index < 3;
  const badgeColor = index % 2 === 0 ? '#0ea5e9' : '#64748b'; // Blue (TM) or Grey (PĐ)
  const badgeLabel = index % 2 === 0 ? `TM.${item.year || 24}` : `PĐ.${index + 1}`;

  return (
    <Link href={`/movie/${item.slug}`} asChild>
      <Pressable style={{ width: ITEM_WIDTH, marginBottom: 16 }}>
        <View style={{ borderRadius: 8, overflow: 'hidden', height: ITEM_WIDTH * 1.5, marginBottom: 8 }}>
          <Image
            source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
          />
          {/* Rank Badge - RoPhim Style */}
          <View style={{
            position: 'absolute',
            top: 6,
            left: 6,
            backgroundColor: badgeColor,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            minWidth: 30,
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{badgeLabel}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={{ color: 'white', fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={{ color: '#9ca3af', fontSize: 10 }}>
          {item.origin_name}
        </Text>
      </Pressable>
    </Link>
  );
};

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [hotMovies, setHotMovies] = useState<Movie[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load search history
    AsyncStorage.getItem('search_history').then(data => {
      if (data) setSearchHistory(JSON.parse(data));
    });
    // Fetch mock "Hot" movies (using Phim Le)
    getHomeData().then((data) => {
      if (data.phimLe) {
        setHotMovies(data.phimLe.slice(0, 9)); // Show top 9
      }
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const query = search.trim();
      const results = await searchMovies(query, 20);
      setSearchResults(results);
      setSearching(false);

      // Save to history if we got results (or even if we didn't, to track intent)
      if (query.length > 1) {
        AsyncStorage.getItem('search_history').then(data => {
          let history = data ? JSON.parse(data) : [];
          // Remove if exists to push to front
          history = history.filter((item: string) => item.toLowerCase() !== query.toLowerCase());
          history.unshift(query);
          if (history.length > 10) history.pop(); // Keep top 10
          setSearchHistory(history);
          AsyncStorage.setItem('search_history', JSON.stringify(history));
        });
      }

    }, 800);
    return () => clearTimeout(timer);
  }, [search]);

  const clearHistory = () => {
    setSearchHistory([]);
    AsyncStorage.removeItem('search_history');
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Search Header */}
        <View className="px-4 pb-4 pt-2">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-[#1e293b] rounded-full px-4 py-3 border border-gray-800">
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm kiếm phim, diễn viên"
                placeholderTextColor="#64748b"
                className="flex-1 ml-3 text-white text-base font-medium"
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>
            {/* Filter Icon */}
            <Pressable className="bg-[#1e293b] w-12 h-12 rounded-full items-center justify-center border border-gray-800">
              <Ionicons name="options-outline" size={22} color="white" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {search.length > 0 ? (
            /* Search Results */
            <View className="px-4">
              <Text className="text-white text-lg font-bold mb-4">Kết quả tìm kiếm</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: ITEM_SPACING }}>
                {searchResults.map((item, index) => (
                  <HotMovieItem key={item._id || index} item={item} index={index} />
                ))}
              </View>
              {searching && <Text className="text-gray-400 text-center mt-4">Đang tìm...</Text>}
            </View>
          ) : (
            <View className="px-4">
              {/* Search History Section */}
              {searchHistory.length > 0 && (
                <View className="mb-6 mt-2">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white text-base font-bold">Lịch sử tìm kiếm</Text>
                    <Pressable onPress={clearHistory}>
                      <Text className="text-gray-400 text-xs">Xóa lịch sử</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {searchHistory.map((item, index) => (
                      <Pressable
                        key={index}
                        onPress={() => setSearch(item)}
                        className="bg-[#1e293b] px-4 py-2 rounded-full border border-gray-700 flex-row items-center gap-2"
                      >
                        <Ionicons name="time-outline" size={14} color="#94a3b8" />
                        <Text className="text-gray-300 text-sm">{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Hot Search Section */}
              <Text className="text-white text-base font-bold mb-4 mt-2">Được tìm kiếm nhiều</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {hotMovies.map((item, index) => (
                  <HotMovieItem key={item._id || index} item={item} index={index} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
