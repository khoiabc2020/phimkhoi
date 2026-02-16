import { Image, StyleSheet, Platform, ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import { getHomeData, Movie } from '@/services/api';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    phimLe: Movie[];
    phimBo: Movie[];
    hoatHinh: Movie[];
    tvShows: Movie[];
  }>({ phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] });

  useEffect(() => {
    const remove = () => { };
    // Data fetching
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
    return remove;
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  if (data.phimLe.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Không có dữ liệu phim.</Text>
        <Text className="text-gray-400 mt-2">Vui lòng kiểm tra kết nối mạng.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection movies={data.phimLe.slice(0, 5)} />

        <View className="mt-6 space-y-6">
          <MovieRow title="Phim Lẻ Mới" movies={data.phimLe} />
          <MovieRow title="Phim Bộ Hot" movies={data.phimBo} />
          <MovieRow title="Hoạt Hình" movies={data.hoatHinh} />
          <MovieRow title="TV Shows" movies={data.tvShows} />
        </View>
      </ScrollView>
    </View>
  );
}
