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
      {/* Floating Header (Absolute) */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-50 px-4 pt-2">
        <View className="flex-row justify-between items-center bg-transparent">
          <View className="flex-row items-center gap-3">
            {/* RoPhim Logo Style */}
            <View className="relative w-10 h-10 justify-center items-center">
              <View className="absolute w-full h-full bg-[#fbbf24] rounded-full opacity-20" />
              <View className="w-10 h-10 rounded-full border-2 border-[#fbbf24] justify-center items-center bg-black/40 backdrop-blur-md">
                <Ionicons name="play" size={20} color="#fbbf24" style={{ marginLeft: 3 }} />
              </View>
              {/* Decorative curve/bowl if possible, but keep simple for now */}
            </View>

            <View>
              <Text className="text-white font-extrabold text-2xl leading-7 tracking-tighter">MovieBox</Text>
              <Text className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">Xem phim là mê</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={() => router.push('/notifications' as any)}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md active:bg-white/20">
              <Ionicons name="notifications-outline" size={22} color="white" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as any)}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md active:bg-white/20">
              <Ionicons name="settings-outline" size={22} color="white" />
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
        <View className="mt-2 pl-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 8 }}>
            <Link href="/explore" asChild>
              <Pressable className="flex-row items-center bg-[#fff] px-4 py-2 rounded-full active:bg-gray-200">
                <Text className="text-black font-bold text-xs">Đề xuất</Text>
              </Pressable>
            </Link>
            {NAV_PILLS.slice(1).map((item, index) => (
              <Link key={item.slug + index} href={`/list/${item.slug}` as any} asChild>
                <Pressable className="flex-row items-center bg-transparent border border-gray-700 px-4 py-2 rounded-full active:bg-gray-800">
                  <Text className="text-white font-medium text-xs">{item.label}</Text>
                </Pressable>
              </Link>
            ))}
            <Link href="/explore" asChild>
              <Pressable className="flex-row items-center bg-transparent border border-gray-700 px-4 py-2 rounded-full active:bg-gray-800">
                <Text className="text-white font-medium text-xs">Thể loại</Text>
                <Ionicons name="chevron-down" size={14} color="white" style={{ marginLeft: 4 }} />
              </Pressable>
            </Link>
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-base font-bold">Bạn đang quan tâm gì?</Text>
            <Link href="/explore" asChild>
              <Pressable>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </Pressable>
            </Link>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <CategoryCard title="Hành Động" slug="hanh-dong" colors={CATEGORY_GRADIENTS[0] as [string, string, ...string[]]} />
            <CategoryCard title="Tình Cảm" slug="tinh-cam" colors={CATEGORY_GRADIENTS[1] as [string, string, ...string[]]} />
            <CategoryCard title="Kinh Dị" slug="kinh-di" colors={CATEGORY_GRADIENTS[2] as [string, string, ...string[]]} />
            <CategoryCard title="Hài Hước" slug="hai-huoc" colors={CATEGORY_GRADIENTS[3] as [string, string, ...string[]]} />
            <CategoryCard title="Viễn Tưởng" slug="vien-tuong" colors={CATEGORY_GRADIENTS[4] as [string, string, ...string[]]} />
          </ScrollView>
        </View>

        <View className="mt-6 space-y-6">
          <MovieRow title="Phim Lẻ Mới Cập Nhật" movies={data.phimLe} />
          <MovieRow title="Phim Bộ Đang Hot" movies={data.phimBo} />
          <MovieRow title="Hoạt Hình Đặc Sắc" movies={data.hoatHinh} />
          <MovieRow title="TV Shows Giải Trí" movies={data.tvShows} />
        </View>
      </ScrollView>
    </View>
  );
}
