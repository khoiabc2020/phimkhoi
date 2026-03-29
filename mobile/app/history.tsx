import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { apiFetch } from '@/lib/apiFetch';
import { getImageUrl } from '@/services/api';
import { COLORS } from '@/constants/theme';
import { FlashList } from '@shopify/flash-list';

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
            const res = await apiFetch(`${CONFIG.BACKEND_URL}/api/mobile/user/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setLoading(false);
        }
    }, [user, token]);

    // Reload khi quay lại màn hình
    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            day: 'numeric', month: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="light" />
                <View style={[styles.header, { marginBottom: 16 }]}>
                    <View style={[styles.backBtn, { opacity: 0.5 }]} />
                    <View style={{ flex: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <View style={{ width: 60, height: 28, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }} />
                </View>
                <View style={styles.listContent}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.card}>
                            <View style={[styles.posterContainer, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                            <View style={{ flex: 1, padding: 12, gap: 8 }}>
                                <View style={{ height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, width: '80%' }} />
                                <View style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, width: '50%' }} />
                                <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, width: '40%' }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar style="light" />
                <Ionicons name="person-outline" size={48} color="#555" />
                <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch sử</Text>
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
                    <Text style={styles.headerTitle}>Lịch Sử Xem</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{history.length} phim</Text>
                    </View>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="film-outline" size={64} color="#333" />
                        <Text style={styles.emptyText}>Chưa có lịch sử xem phim</Text>
                        <Text style={styles.emptySubText}>Bắt đầu xem phim để lưu lịch sử</Text>
                    </View>
                ) : (
                    <FlashList
                        data={history}
                        keyExtractor={(item, index) => item._id || item.slug || `item-${index}`}
                        estimatedItemSize={146}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#E50914"
                            />
                        }
                        renderItem={({ item }) => {
                            // Dùng đúng fields từ API response mới
                            const movieName = item.movieName || item.movie?.name || item.slug;
                            const poster = item.moviePoster || item.movie?.thumb_url || item.movie?.poster_url;
                            // Làm sạch t&ecirc;n tập: "tap-06" -> "Tập 6", "full" -> "Tập Full"
                            const rawEp = item.episodeName || item.episode || '';
                            let episodeName = 'Xem phim';
                            if (rawEp) {
                                const lower = rawEp.toLowerCase();
                                if (lower === 'full' || lower === 'fullhd' || lower === 'tập full') {
                                    episodeName = 'Tập Full';
                                } else {
                                    const match = rawEp.match(/(\d+)/);
                                    episodeName = match ? `Tập ${parseInt(match[1], 10)}` : `Tập ${rawEp}`;
                                }
                            }
                            const progress = item.progress || 0;

                            return (
                                <Pressable
                                    style={styles.card}
                                    onPress={() => router.push(`/player/${item.slug}?ep=${item.episode || item.episodeName || ''}` as any)}
                                >
                                    {/* Ảnh bên trái */}
                                    <View style={styles.posterContainer}>
                                        <Image
                                            source={{ uri: getImageUrl(poster) }}
                                            style={styles.poster}
                                            contentFit="cover"
                                            transition={300}
                                        />
                                        {/* Progress bar đáy ảnh */}
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
                                        </View>
                                        {/* Episode badge */}
                                        <View style={styles.episodeBadge}>
                                            <Text style={styles.episodeBadgeText}>{episodeName}</Text>
                                        </View>
                                    </View>

                                    {/* Info bên phải */}
                                    <View style={styles.info}>
                                        <Text style={styles.movieName} numberOfLines={2}>{movieName}</Text>
                                        <Text style={styles.originName} numberOfLines={1}>
                                            {item.movieOriginName || item.movie?.original_name || ''}
                                        </Text>
                                        <Text style={styles.timeText}>
                                            {formatTime(item.timestamp || Date.now())}
                                        </Text>
                                        <View style={styles.continueBtn}>
                                            <Ionicons name="play-circle" size={16} color="#E50914" />
                                            <Text style={styles.continueBtnText}>Tiếp tục xem</Text>
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
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    safeArea: { flex: 1 },
    centered: { flex: 1, backgroundColor: COLORS.bg0, justifyContent: 'center', alignItems: 'center', gap: 12 },
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
        backgroundColor: 'rgba(143,167,197,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.32)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: { color: '#c7d7ea', fontSize: 12, fontWeight: '600' },
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
    progressBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#e50914',
    },
    episodeBadge: {
        position: 'absolute',
        top: 6, right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    episodeBadgeText: { color: '#c7d7ea', fontSize: 10, fontWeight: '700' },
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
    timeText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginTop: 4,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 8,
    },
    continueBtnText: {
        color: '#c7d7ea',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
    emptySubText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
});
