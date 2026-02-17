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
        <View className="flex-row justify-between items-center bg-transparent">
          <View className="flex-row items-center gap-3">
            {/* MovieBox Logo Style */}
            <View className="flex-row items-center">
              <Ionicons name="film" size={32} color="#fbbf24" />
              <View className="ml-2">
                <Text className="text-white font-black text-xl leading-5 tracking-tighter" style={{ fontFamily: 'System' }}>MovieBox</Text>
                <Text className="text-gray-400 text-[10px] tracking-widest font-bold">Xem phim là mê</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={() => router.push('/notifications' as any)}
              className="w-9 h-9 rounded-full bg-white/10 items-center justify-center backdrop-blur-md active:bg-white/20 relative">
              <Ionicons name="notifications-outline" size={20} color="white" />
              <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black" />
            </Pressable>
            <Pressable onPress={() => router.push('/settings' as any)}
              className="w-9 h-9 rounded-full bg-white/10 items-center justify-center backdrop-blur-md active:bg-white/20">
              <Ionicons name="settings-outline" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Pills */}
        <View className="mt-20 pl-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 8 }}>
            <Link href="/explore" asChild>
              <Pressable className="bg-white px-4 py-1.5 rounded-full active:bg-gray-200">
                <Text className="text-black font-bold text-xs">Đề xuất</Text>
              </Pressable>
            </Link>
            {NAV_PILLS.slice(1).map((item, index) => (
              <Link key={item.slug + index} href={`/list/${item.slug}` as any} asChild>
                <Pressable className="bg-transparent border border-white/20 px-4 py-1.5 rounded-full active:bg-white/10">
                  <Text className="text-white font-medium text-xs">{item.label}</Text>
                </Pressable>
              </Link>
            ))}
            <Pressable className="bg-transparent border border-white/20 px-4 py-1.5 rounded-full active:bg-white/10 flex-row items-center gap-1">
              <Text className="text-white font-medium text-xs">Thể loại</Text>
              <Ionicons name="chevron-down" size={12} color="white" />
            </Pressable>
          </ScrollView>
        </View>

        <HeroSection movies={data.phimLe.slice(0, 8)} />

        {/* Categories Section - "Bạn đang quan tâm gì?" */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-lg font-bold">Bạn đang quan tâm gì?</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <CategoryCard title="Xuyên Không" slug="xuyen-khong" colors={['#ef4444', '#f87171']} width={160} height={85} />
            <CategoryCard title="Cổ Trang" slug="co-trang" colors={['#ea580c', '#fb923c']} width={160} height={85} />
            <CategoryCard title="Hành Động" slug="hanh-dong" colors={['#059669', '#34d399']} width={160} height={85} />
            <CategoryCard title="Tình Cảm" slug="tinh-cam" colors={['#db2777', '#f472b6']} width={160} height={85} />
          </ScrollView>
        </View>

        <View className="mt-6 space-y-6">
          <MovieRow title="Phim Trung Quốc mới" movies={data.phimBo.filter(m => m.origin_name?.includes('China') || true).slice(0, 10)} />
          <MovieRow title="Phim US-UK mới" movies={data.phimLe.filter(m => !m.origin_name?.includes('China')).slice(0, 10)} />
          <MovieRow title="Hoạt Hình Đặc Sắc" movies={data.hoatHinh} />
        </View>
      </ScrollView>
    </View>
  );
}
