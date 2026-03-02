import { View, Text, TextInput, Pressable, Dimensions, Modal, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchMovies, searchActors, Movie, getHomeData, getImageUrl, getMenuData } from '@/services/api';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SPACING = 10;
const ITEM_WIDTH = (width - 32 - (ITEM_SPACING * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

const HotMovieItem = ({ item, index }: { item: Movie, index: number }) => {
  const badgeColor = index % 2 === 0 ? '#0ea5e9' : '#64748b';
  const badgeLabel = index % 2 === 0 ? `TM.${item.year || 24}` : `PĐ.${index + 1}`;

  return (
    <Link href={`/movie/${item.slug}`} asChild>
      <Pressable style={{ width: ITEM_WIDTH, marginBottom: 16 }}>
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', height: ITEM_WIDTH * 1.5, marginBottom: 8 }}>
          <Image
            source={{ uri: getImageUrl(item.poster_url || item.thumb_url) }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
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
  const [actorResults, setActorResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hotMovies, setHotMovies] = useState<Movie[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Filters State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const years = Array.from(new Array(15), (val, index) => (new Date().getFullYear()) - index);

  useEffect(() => {
    AsyncStorage.getItem('search_history').then(data => {
      if (data) setSearchHistory(JSON.parse(data));
    });
    getHomeData().then((data) => {
      if (data.phimLe) setHotMovies(data.phimLe.slice(0, 9));
    });
    getMenuData().then((data) => {
      setCategories(data.categories);
      setCountries(data.countries);
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setActorResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const query = search.trim();
      // Fetch movies and actors concurrently for best performance
      const [results, actors] = await Promise.all([
        searchMovies(query, 40),
        searchActors(query)
      ]);
      setSearchResults(results);
      setActorResults(actors);
      setSearching(false);

      if (query.length > 1) {
        AsyncStorage.getItem('search_history').then(data => {
          let history = data ? JSON.parse(data) : [];
          history = history.filter((item: string) => item.toLowerCase() !== query.toLowerCase());
          history.unshift(query);
          if (history.length > 10) history.pop();
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

  // Client-side filtering logic
  const filteredResults = useMemo(() => {
    return searchResults.filter((movie) => {
      if (selectedCategory !== 'all') {
        const hasCategory = movie.category?.some((c: any) => c.slug === selectedCategory);
        if (!hasCategory) return false;
      }
      if (selectedCountry !== 'all') {
        const hasCountry = movie.country?.some((c: any) => c.slug === selectedCountry);
        if (!hasCountry) return false;
      }
      if (selectedYear !== 'all') {
        if (movie.year !== parseInt(selectedYear)) return false;
      }
      return true;
    });
  }, [searchResults, selectedCategory, selectedCountry, selectedYear]);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedCountry !== 'all' ? 1 : 0) + (selectedYear !== 'all' ? 1 : 0);

  const renderHeader = () => (
    <View className="px-4 mb-4">
      {/* Actor results horizontal row */}
      {actorResults.length > 0 && (
        <View className="mb-5">
          <Text className="text-white text-sm font-bold mb-3" style={{ color: '#F4C84A' }}>
            Diễn viên / Đạo diễn
          </Text>
          <FlashList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={actorResults}
            keyExtractor={(actor) => actor.id?.toString() || Math.random().toString()}
            contentContainerStyle={{ paddingRight: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
            estimatedItemSize={72}
            renderItem={({ item: actor }) => {
              const profileImg = actor.profile_path
                ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                : null;
              return (
                <Pressable
                  onPress={() => router.push(`/movie/${encodeURIComponent(actor.name)}` as any)}
                  style={{ alignItems: 'center', width: 72 }}
                >
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    overflow: 'hidden', borderWidth: 2,
                    borderColor: 'rgba(244,200,74,0.4)',
                    backgroundColor: '#1e293b', marginBottom: 6
                  }}>
                    {profileImg ? (
                      <Image source={{ uri: profileImg }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={28} color="#475569" />
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} style={{ color: 'white', fontSize: 10, fontWeight: '600', textAlign: 'center' }}>
                    {actor.name}
                  </Text>
                  <Text numberOfLines={1} style={{ color: '#94a3b8', fontSize: 9, textAlign: 'center' }}>
                    {actor.known_for_department === 'Acting' ? 'Diễn viên' : actor.known_for_department}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}
      <Text className="text-white text-sm font-bold mb-1">
        {filteredResults.length > 0 ? 'Phim' : 'Kết quả tìm kiếm'}
      </Text>
      {filteredResults.length > 0 && (
        <Text className="text-gray-400 text-xs mb-3">
          Tìm thấy {filteredResults.length} phim {searchResults.length !== filteredResults.length && `(từ ${searchResults.length} gốc)`}
        </Text>
      )}
    </View>
  );

  const renderEmptySearch = () => {
    if (searching) return (
      <View className="flex-1 items-center justify-center mt-20">
        <ActivityIndicator size="large" color="#F4C84A" />
        <Text className="text-gray-400 text-center mt-4">Đang tìm...</Text>
      </View>
    );

    if (search.trim() && filteredResults.length === 0 && actorResults.length === 0) return (
      <View className="items-center justify-center mt-20 px-6">
        <Ionicons name="search-outline" size={60} color="#334155" />
        <Text className="text-white text-lg font-bold mt-4 mb-2">Không tìm thấy kết quả</Text>
        <Text className="text-gray-400 text-center">Thử thay đổi từ khóa hoặc điều chỉnh bộ lọc để xem các phim khác xem sao nhé.</Text>
      </View>
    );

    // Only actors found but no movies - show actor section with empty movie note
    if (search.trim() && filteredResults.length === 0 && actorResults.length > 0) return (
      <View className="px-4 mt-4">
        <Text style={{ color: '#F4C84A', fontSize: 13, fontWeight: '700', marginBottom: 12 }}>Diễn viên / Đạo diễn</Text>
        <FlashList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={actorResults}
          keyExtractor={(actor) => actor.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingRight: 20, paddingBottom: 12 }}
          ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
          estimatedItemSize={80}
          renderItem={({ item: actor }) => {
            const profileImg = actor.profile_path
              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
              : null;
            return (
              <Pressable
                onPress={() => router.push(`/movie/${encodeURIComponent(actor.name)}` as any)}
                style={{ alignItems: 'center', width: 80 }}
              >
                <View style={{
                  width: 72, height: 72, borderRadius: 36, overflow: 'hidden',
                  borderWidth: 2, borderColor: 'rgba(244,200,74,0.5)',
                  backgroundColor: '#1e293b', marginBottom: 8
                }}>
                  {profileImg ? (
                    <Image source={{ uri: profileImg }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={32} color="#475569" />
                    </View>
                  )}
                </View>
                <Text numberOfLines={2} style={{ color: 'white', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
                  {actor.name}
                </Text>
                <Text numberOfLines={1} style={{ color: '#94a3b8', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                  {actor.known_for_department === 'Acting' ? 'Diễn viên' : actor.known_for_department}
                </Text>
              </Pressable>
            );
          }}
        />
        <Text style={{ color: '#475569', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
          Không có phim khớp với từ khóa này
        </Text>
      </View>
    );

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
        {searchHistory.length > 0 && (
          <View style={{ marginBottom: 24, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                Lịch sử tìm kiếm
              </Text>
              <Pressable onPress={clearHistory} hitSlop={10}>
                <Text style={{ color: '#F4C84A', fontSize: 12, fontWeight: '600' }}>Xóa tất cả</Text>
              </Pressable>
            </View>
            {searchHistory.map((item, index) => (
              <Pressable
                key={index}
                onPress={() => setSearch(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: 'rgba(255,255,255,0.06)',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="time-outline" size={16} color="#475569" style={{ marginRight: 12 }} />
                <Text style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{item}</Text>
                <Pressable
                  onPress={() => setSearch(item)}
                  hitSlop={10}
                >
                  <Ionicons name="arrow-up-outline" size={16} color="#475569" style={{ transform: [{ rotate: '45deg' }] }} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 }}>
          Đề xuất phổ biến
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: ITEM_SPACING }}>
          {hotMovies.map((item, index) => (
            <HotMovieItem key={item._id || index} item={item} index={index} />
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderItem = useCallback(({ item, index }: { item: Movie, index: number }) => (
    <HotMovieItem item={item} index={index} />
  ), []);

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
                placeholder="Tìm kiếm phim, diễn viên..."
                placeholderTextColor="#64748b"
                className="flex-1 ml-3 text-white text-base font-medium"
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => { setSearch(''); setSelectedCategory('all'); setSelectedCountry('all'); setSelectedYear('all'); }}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>

            {/* Filter Toggle */}
            <Pressable
              onPress={() => setIsFilterVisible(true)}
              className="bg-[#1e293b] w-12 h-12 rounded-full items-center justify-center border border-gray-800 relative shadow-sm"
              style={{ elevation: 2 }}
            >
              <Ionicons name="options-outline" size={22} color={activeFiltersCount > 0 ? "#F4C84A" : "white"} />
              {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0f172a] items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Content: Either Search Results FlatList or Default Views */}
        {search.trim() && (filteredResults.length > 0 || actorResults.length > 0) ? (
          <FlashList
            data={filteredResults.map((item, index) => {
              if (item.empty) return item;
              return item;
            })}
            keyExtractor={item => item._id || item.slug || Math.random().toString()}
            numColumns={COLUMN_COUNT}
            estimatedItemSize={ITEM_WIDTH * 1.5 + 40}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              if (item.empty) {
                return <View style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, marginLeft: index % 3 !== 0 ? ITEM_SPACING : 0, backgroundColor: 'transparent' }} />;
              }
              return (
                <View style={{ marginLeft: index % 3 !== 0 ? ITEM_SPACING : 0, marginBottom: ITEM_SPACING + 4 }}>
                  <HotMovieItem item={item} index={index} />
                </View>
              );
            }}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            {renderEmptySearch()}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Filter Modal */}
      <Modal visible={isFilterVisible} animationType="slide" transparent={true} onRequestClose={() => setIsFilterVisible(false)}>
        <View className="flex-1 justify-end">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
          <View className="bg-[#111319] w-full rounded-t-[32px] border-t border-white/10 p-4 pb-8 max-h-[85%] shadow-lg">
            <View className="flex-row items-center justify-between mb-4 px-2 pt-2">
              <Text className="text-white text-xl font-bold">Bộ lọc tìm kiếm</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} className="bg-white/10 rounded-full p-2">
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* Thể loại */}
              <Text className="text-white font-semibold mb-3 ml-2 text-lg">Thể Loại</Text>
              <View className="flex-row flex-wrap gap-2 px-2 pb-6">
                <TouchableOpacity onPress={() => setSelectedCategory('all')} className={`px-4 py-2.5 border rounded-full ${selectedCategory === 'all' ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                  <Text className={selectedCategory === 'all' ? 'text-black font-semibold' : 'text-gray-300'}>Tất cả</Text>
                </TouchableOpacity>
                {categories.map((c: any) => (
                  <TouchableOpacity key={c.slug} onPress={() => setSelectedCategory(c.slug)} className={`px-4 py-2.5 border rounded-full ${selectedCategory === c.slug ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                    <Text className={selectedCategory === c.slug ? 'text-black font-semibold' : 'text-gray-300'}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quốc Gia */}
              <Text className="text-white font-semibold mb-3 ml-2 text-lg">Quốc Gia</Text>
              <View className="flex-row flex-wrap gap-2 px-2 pb-6">
                <TouchableOpacity onPress={() => setSelectedCountry('all')} className={`px-4 py-2.5 border rounded-full ${selectedCountry === 'all' ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                  <Text className={selectedCountry === 'all' ? 'text-black font-semibold' : 'text-gray-300'}>Tất cả</Text>
                </TouchableOpacity>
                {countries.map((c: any) => (
                  <TouchableOpacity key={c.slug} onPress={() => setSelectedCountry(c.slug)} className={`px-4 py-2.5 border rounded-full ${selectedCountry === c.slug ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                    <Text className={selectedCountry === c.slug ? 'text-black font-semibold' : 'text-gray-300'}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Năm Phát Hành */}
              <Text className="text-white font-semibold mb-3 ml-2 text-lg">Năm Phát Hành</Text>
              <View className="flex-row flex-wrap gap-2 px-2 pb-6">
                <TouchableOpacity onPress={() => setSelectedYear('all')} className={`px-4 py-2.5 border rounded-full ${selectedYear === 'all' ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                  <Text className={selectedYear === 'all' ? 'text-black font-semibold' : 'text-gray-300'}>Tất cả</Text>
                </TouchableOpacity>
                {years.map((y) => (
                  <TouchableOpacity key={y} onPress={() => setSelectedYear(y.toString())} className={`px-4 py-2.5 border rounded-full ${selectedYear === y.toString() ? 'bg-[#F4C84A] border-[#F4C84A]' : 'bg-transparent border-white/20'}`}>
                    <Text className={selectedYear === y.toString() ? 'text-black font-semibold' : 'text-gray-300'}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row gap-4 mt-auto pt-2">
              <TouchableOpacity onPress={() => { setSelectedCategory('all'); setSelectedCountry('all'); setSelectedYear('all'); }} className="flex-1 py-4 bg-white/5 rounded-2xl items-center border border-white/10">
                <Text className="text-white font-bold text-base">Xóa Bô Lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} className="flex-[1.5] py-4 bg-[#F4C84A] rounded-2xl items-center shadow-[0_4px_14px_rgba(244,200,74,0.39)]">
                <Text className="text-black font-bold text-base">Áp Dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
