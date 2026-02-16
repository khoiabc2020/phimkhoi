import { View, Text, FlatList, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { getImageUrl } from '@/services/api';

export default function HistoryScreen() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!user || !token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setHistory(data.history);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            day: 'numeric', month: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="light" />
                <Ionicons name="time-outline" size={48} color="#fbbf24" />
            </View>
        );
    }

    if (!user) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="light" />
                <Text className="text-white">Vui lòng đăng nhập để xem lịch sử</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <SafeAreaView className="flex-1 px-4">
                <View className="flex-row items-center py-4 mb-2">
                    <Pressable onPress={() => router.back()} className="mr-4 p-2 bg-gray-800 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Text className="text-white text-2xl font-bold">Lịch Sử Xem</Text>
                    <View className="flex-1" />
                    <View className="bg-yellow-500/20 px-3 py-1 rounded-full">
                        <Text className="text-yellow-500 font-bold">{history.length} Phim</Text>
                    </View>
                </View>

                {history.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="film-outline" size={64} color="#444" />
                        <Text className="text-gray-400 mt-4">Chưa có lịch sử xem phim</Text>
                    </View>
                ) : (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item._id || item.slug}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fbbf24" />}
                        renderItem={({ item }) => (
                            <Link href={`/movie/${item.slug}`} asChild>
                                <Pressable className="flex-row bg-gray-900 mb-4 rounded-xl overflow-hidden active:bg-gray-800">
                                    <View className="w-24 h-36">
                                        <Image
                                            source={{ uri: getImageUrl(item.movie?.thumb_url || item.movie?.poster_url) }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute bottom-0 right-0 bg-black/80 px-1">
                                            <Text className="text-yellow-500 text-xs font-bold">
                                                {item.episode ? `Tập ${item.episode}` : 'Đang xem'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-1 p-3 justify-between">
                                        <View>
                                            <Text className="text-white font-bold text-lg numberOfLines={2}">
                                                {item.movie?.name || item.slug}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-1">
                                                Xem lúc: {formatTime(item.timestamp)}
                                            </Text>
                                        </View>

                                        <View className="flex-row justify-end">
                                            <Pressable className="flex-row items-center">
                                                <Text className="text-yellow-500 mr-1 text-sm">Tiếp tục xem</Text>
                                                <Ionicons name="play-circle" size={18} color="#fbbf24" />
                                            </Pressable>
                                        </View>
                                    </View>
                                </Pressable>
                            </Link>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
