import { Image, ScrollView, View, ActivityIndicator, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategoryCard from '@/components/CategoryCard';
import { getHomeData, Movie } from '@/services/api';

const CATEGORY_GRADIENTS = [
  ['#4f46e5', '#818cf8'], // Indigo
  ['#db2777', '#f472b6'], // Pink
  ['#059669', '#34d399'], // Emerald
  ['#d97706', '#fbbf24'], // Amber
  ['#7c3aed', '#a78bfa'], // Violet
  ['#dc2626', '#f87171'], // Red
];

const NAV_PILLS = [
  { label: 'Đề xuất', slug: 'phim-le', icon: 'star' },
  { label: 'Phim bộ', slug: 'phim-bo', icon: 'albums' },
  { label: 'Phim lẻ', slug: 'phim-le', icon: 'film' },
  { label: 'Hoạt hình', slug: 'hoat-hinh', icon: 'happy' },
  { label: 'TV Shows', slug: 'tv-shows', icon: 'tv' },
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [data, setData] = useState<{
    phimLe: Movie[];
    phimBo: Movie[];
    hoatHinh: Movie[];
    tvShows: Movie[];
  }>({ phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getHomeData();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Floating Header (Absolute) */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-50 px-4 pt-2">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center bg-black/50 rounded-full px-4 py-1.5 border border-white/10 backdrop-blur-md">
            <Image
              source={require('../../assets/images/icon.png')}
              style={{ width: 28, height: 28, borderRadius: 14 }}
            />
            <View className="ml-2">
              <Text className="text-white font-bold text-lg leading-5">MovieBox</Text>
              <Text className="text-gray-400 text-[10px] leading-3">Phim hay cả rổ</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Pressable onPress={() => router.push('/notifications')} className="bg-black/50 p-2 rounded-full border border-white/10 backdrop-blur-md">
              <Ionicons name="notifications-outline" size={20} color="white" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} className="bg-black/50 p-2 rounded-full border border-white/10 backdrop-blur-md">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection movies={data.phimLe.slice(0, 8)} />

        {/* Navigation Pills */}
        <View className="mt-6 pl-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 8 }}>
            {NAV_PILLS.map((item, index) => (
              <Link key={item.slug + index} href={`/list/${item.slug}`} asChild>
                <Pressable className="flex-row items-center bg-gray-900 border border-gray-800 px-4 py-2 rounded-full active:bg-gray-800">
                  {/* <Ionicons name={item.icon as any} size={16} color="#fbbf24" style={{ marginRight: 6 }} /> */}
                  <Text className="text-white font-medium">{item.label}</Text>
                </Pressable>
              </Link>
            ))}
            <Link href="/explore" asChild>
              <Pressable className="flex-row items-center bg-gray-900 border border-gray-800 px-4 py-2 rounded-full active:bg-gray-800">
                <Text className="text-white font-medium">Thể loại</Text>
                <Ionicons name="chevron-down" size={16} color="white" style={{ marginLeft: 4 }} />
              </Pressable>
            </Link>
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View className="mt-8 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">Bạn đang quan tâm gì?</Text>
            <Link href="/explore" asChild>
              <Pressable>
                <Ionicons name="chevron-forward" size={24} color="#6b7280" />
              </Pressable>
            </Link>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <CategoryCard title="Hành Động" slug="hanh-dong" colors={CATEGORY_GRADIENTS[0]} />
            <CategoryCard title="Tình Cảm" slug="tinh-cam" colors={CATEGORY_GRADIENTS[1]} />
            <CategoryCard title="Kinh Dị" slug="kinh-di" colors={CATEGORY_GRADIENTS[2]} />
            <CategoryCard title="Hài Hước" slug="hai-huoc" colors={CATEGORY_GRADIENTS[3]} />
            <CategoryCard title="Viễn Tưởng" slug="vien-tuong" colors={CATEGORY_GRADIENTS[4]} />
          </ScrollView>
        </View>

        <View className="mt-8 space-y-8">
          <MovieRow title="Phim Lẻ Mới Cập Nhật" movies={data.phimLe} />
          <MovieRow title="Phim Bộ Đang Hot" movies={data.phimBo} />
          <MovieRow title="Hoạt Hình Đặc Sắc" movies={data.hoatHinh} />
          <MovieRow title="TV Shows Giải Trí" movies={data.tvShows} />
        </View>
      </ScrollView>
    </View>
  );
}
