import { View, Text, FlatList, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

interface WatchlistItem {
    movieId: string;
    movieSlug: string;
    movieName: string;
    movieOriginName?: string;
    moviePoster?: string;
    movieYear?: number;
    movieQuality?: string;
}

export default function WatchListScreen() {
    const [movies, setMovies] = useState<WatchlistItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user, token } = useAuth();

    const loadData = useCallback(async () => {
        try {
            if (token) {
                // Fetch live from API
                const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMovies(data.watchlist || []);
                    return;
                }
            }
            setMovies([]);
        } catch (e) {
            console.error(e);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <View className="px-4 py-3 border-b border-gray-800 flex-row items-center gap-3">
                    <Pressable onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Text className="text-white text-xl font-bold">Danh sách theo dõi</Text>
                    <Text className="text-gray-500 text-sm ml-auto">({movies.length} phim)</Text>
                </View>

                {movies.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="add-circle-outline" size={64} color="#374151" />
                        <Text className="text-gray-500 mt-4 text-center px-10">
                            Bạn chưa thêm phim nào vào danh sách.{'\n'}Ấn "+ Danh sách" trên trang phim để thêm.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={movies}
                        keyExtractor={(item) => item.movieSlug}
                        contentContainerStyle={{ padding: 16, gap: 16 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" colors={['#fbbf24']} />
                        }
                        renderItem={({ item }) => (
                            <Pressable
                                className="flex-row bg-[#1c1c1c] rounded-xl overflow-hidden"
                                onPress={() => router.push(`/movie/${item.movieSlug}` as any)}
                            >
                                <Image
                                    source={{ uri: item.moviePoster }}
                                    className="w-24 h-36 bg-gray-800"
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-3 justify-between">
                                    <View>
                                        <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
                                            {item.movieName}
                                        </Text>
                                        {item.movieOriginName ? (
                                            <Text className="text-gray-400 text-xs mb-1" numberOfLines={1}>
                                                {item.movieOriginName}
                                            </Text>
                                        ) : null}
                                        <Text className="text-gray-500 text-xs">
                                            {item.movieYear} • {item.movieQuality || 'HD'}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-end">
                                        <Ionicons name="play-circle-outline" size={24} color="#fbbf24" />
                                    </View>
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
