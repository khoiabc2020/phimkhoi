import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { getImageUrl } from '@/services/api';
import { getWatchList, removeFromWatchList } from '@/lib/watchList';

export default function WatchListScreen() {
    const router = useRouter();
    const { user, token, syncWatchList } = useAuth();
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            if (user && token) {
                const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMovies(data.watchlist || []);
                }
            } else {
                const localList = await getWatchList();
                setMovies(localList || []);
            }
        } catch (e) {
            console.error("Failed to load watchlist", e);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        if (user && token) {
            syncWatchList();
        }
        setRefreshing(false);
    }, [load, user, token, syncWatchList]);

    const handleRemove = (item: any) => {
        const slug = item.movieSlug || item.slug;
        const id = item._id || slug;
        const name = item.movieName || item.name || slug;

        Alert.alert(
            "Xoá phim",
            `Thoát khỏi danh sách xem sau?`,
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá",
                    style: "destructive",
                    onPress: async () => {
                        // Cập nhật giao diện lập tức (Optimistic UI)
                        setMovies(prev => prev.filter(m => (m.movieSlug || m.slug) !== slug));

                        try {
                            if (user && token) {
                                await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/watchlist`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ slug })
                                });
                                syncWatchList();
                            } else {
                                await removeFromWatchList(id);
                            }
                        } catch (e) {
                            console.error("Lỗi xoá phim khỏi danh sách:", e);
                            load(); // Khôi phục lại nếu lỗi
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#F4C84A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Danh sách xem sau</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{movies.length} phim</Text>
                    </View>
                </View>

                {movies.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bookmark-outline" size={64} color="#333" />
                        <Text style={styles.emptyText}>Chưa có phim lưu trữ</Text>
                        <Text style={styles.emptySubText}>Ấn dấu "+" Danh sách trên trang phim để lưu lại xem sau.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={movies}
                        keyExtractor={(item, idx) => item._id || item.movieSlug || item.slug || `wl-${idx}`}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#F4C84A"
                            />
                        }
                        renderItem={({ item }) => {
                            const slug = item.movieSlug || item.slug;
                            const movieName = item.movieName || item.name || slug;
                            const originName = item.movieOriginName || item.originName || '';
                            const poster = item.moviePoster || item.thumb_url || item.poster_url;
                            const quality = item.movieQuality || item.quality || 'HD';
                            const year = item.movieYear || item.year || '';

                            return (
                                <Pressable
                                    style={styles.card}
                                    onPress={() => router.push(`/movie/${slug}` as any)}
                                >
                                    {/* Ảnh Thumb */}
                                    <View style={styles.posterContainer}>
                                        <Image
                                            source={{ uri: getImageUrl(poster) }}
                                            style={styles.poster}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                        <View style={styles.qualityBadge}>
                                            <Text style={styles.qualityBadgeText}>{quality}</Text>
                                        </View>
                                    </View>

                                    {/* Info Panel */}
                                    <View style={styles.info}>
                                        <View>
                                            <Text style={styles.movieName} numberOfLines={2}>{movieName}</Text>
                                            {originName ? (
                                                <Text style={styles.originName} numberOfLines={1}>{originName}</Text>
                                            ) : null}
                                            <Text style={styles.yearText}>
                                                Năm phát hành: {year}
                                            </Text>
                                        </View>

                                        {/* Row actions */}
                                        <View style={styles.actionRow}>
                                            <View style={styles.playBtn}>
                                                <Ionicons name="play-circle" size={18} color="#F4C84A" />
                                                <Text style={styles.playBtnText}>Xem phim</Text>
                                            </View>

                                            <Pressable
                                                style={styles.removeBtn}
                                                onPress={(e) => {
                                                    e.stopPropagation(); // Để không click vào Pressable cha (chuyển trang)
                                                    handleRemove(item);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                            </Pressable>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0D12' },
    safeArea: { flex: 1 },
    centered: { flex: 1, backgroundColor: '#0B0D12', justifyContent: 'center', alignItems: 'center', gap: 12 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    countBadge: {
        backgroundColor: 'rgba(244,200,74,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: { color: '#F4C84A', fontSize: 12, fontWeight: '600' },
    listContent: { paddingHorizontal: 16, paddingBottom: 40 },
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    posterContainer: {
        width: 90,
        height: 130,
        position: 'relative',
    },
    poster: { width: '100%', height: '100%' },
    qualityBadge: {
        position: 'absolute',
        top: 6, left: 6,
        backgroundColor: 'rgba(244,200,74,0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    qualityBadgeText: { color: '#000000', fontSize: 10, fontWeight: '700' },
    info: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    movieName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
    },
    originName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: 2,
    },
    yearText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 6,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    playBtnText: {
        color: '#F4C84A',
        fontSize: 12,
        fontWeight: '600',
    },
    removeBtn: {
        padding: 6,
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: 8,
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '500' },
    emptySubText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
