import { View, Text, FlatList, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getWatchList, WatchListMovie } from '@/lib/watchList';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';

export default function WatchListScreen() {
    const [movies, setMovies] = useState<WatchListMovie[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { user } = useAuth(); // If syncing logic exists, use it here

    const loadData = async () => {
        // If user is logged in, we might want to fetch from API in the future
        // For now, consistent with Favorites, we use local storage or synced context
        const list = await getWatchList();
        setMovies(list.reverse()); // Show newest first
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
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
                    <Text className="text-white text-xl font-bold">Danh sách đang theo dõi</Text>
                </View>

                {movies.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="add-circle-outline" size={64} color="#374151" />
                        <Text className="text-gray-500 mt-4 text-center px-10">
                            Bạn chưa thêm phim nào vào danh sách theo dõi.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={movies}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ padding: 16, gap: 16 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" colors={['#fbbf24']} />
                        }
                        renderItem={({ item }) => (
                            <Pressable
                                className="flex-row bg-[#1c1c1c] rounded-xl overflow-hidden"
                                onPress={() => router.push(`/movie/${item.slug}` as any)}
                            >
                                <Image
                                    source={{ uri: item.thumb_url || item.poster_url }}
                                    className="w-24 h-36 bg-gray-800"
                                    resizeMode="cover"
                                />
                                <View className="flex-1 p-3 justify-between">
                                    <View>
                                        <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text className="text-gray-400 text-xs">
                                            Đang theo dõi
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
