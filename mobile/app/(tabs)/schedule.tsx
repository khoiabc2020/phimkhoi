import { View, Text, StyleSheet, Pressable, RefreshControl, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CONFIG } from '@/constants/config';

const API_URL = 'https://phimapi.com';
const BASE_IMG = 'https://phimimg.com/';

interface CinemaMovie {
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    poster_url: string;
    thumb_url: string;
    year: number;
    time: string;
    quality: string;
    lang: string;
    category: { name: string; slug: string }[];
    country: { name: string; slug: string }[];
}

const TABS = ['Đang chiếu', 'Sắp chiếu'] as const;

function MovieRow({ item }: { item: CinemaMovie }) {
    const router = useRouter();
    const img = item.poster_url?.startsWith('http')
        ? item.poster_url
        : `${BASE_IMG}${item.poster_url}`;

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/movie/${item.slug}` as any)}
        >
            <Image source={{ uri: img }} style={styles.poster} contentFit="cover" transition={200} />
            {/* Quality Badge */}
            <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>{item.quality || 'FHD'}</Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardOrigin} numberOfLines={1}>{item.origin_name}</Text>
                <View style={styles.metaRow}>
                    {item.time ? (
                        <View style={styles.metaPill}>
                            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.metaText}>{item.time}</Text>
                        </View>
                    ) : null}
                    {item.year ? (
                        <View style={styles.metaPill}>
                            <Text style={styles.metaText}>{item.year}</Text>
                        </View>
                    ) : null}
                </View>
                {item.category?.length > 0 && (
                    <Text style={styles.genres} numberOfLines={1}>
                        {item.category.slice(0, 3).map((c) => c.name).join(' · ')}
                    </Text>
                )}
                <Pressable
                    style={styles.watchBtn}
                    onPress={() => router.push(`/movie/${item.slug}` as any)}
                >
                    <Ionicons name="play" size={13} color="black" />
                    <Text style={styles.watchBtnText}>Xem ngay</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

export default function ScheduleScreen() {
    const [activeTab, setActiveTab] = useState<0 | 1>(0);
    const [nowShowing, setNowShowing] = useState<CinemaMovie[]>([]);
    const [comingSoon, setComingSoon] = useState<CinemaMovie[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const indicatorLeft = useRef(new Animated.Value(0)).current;

    const fetchData = useCallback(async () => {
        try {
            const [nowRes, soonRes] = await Promise.all([
                fetch(`${API_URL}/v1/api/danh-sach/phim-chieu-rap?page=1&limit=30`).then(r => r.json()),
                fetch(`${API_URL}/v1/api/danh-sach/phim-chieu-rap?page=2&limit=30`).then(r => r.json()),
            ]);
            const pathImg = nowRes.data?.pathImage || '';
            const soonPath = soonRes.data?.pathImage || '';

            const nowItems = (nowRes.data?.items || []).map((item: any) => ({
                ...item,
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : `${BASE_IMG}${item.poster_url}`,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : `${BASE_IMG}${item.thumb_url}`,
            }));
            const soonItems = (soonRes.data?.items || []).map((item: any) => ({
                ...item,
                poster_url: item.poster_url?.startsWith('http') ? item.poster_url : `${BASE_IMG}${item.poster_url}`,
                thumb_url: item.thumb_url?.startsWith('http') ? item.thumb_url : `${BASE_IMG}${item.thumb_url}`,
            }));

            setNowShowing(nowItems);
            setComingSoon(soonItems);
        } catch (e) {
            console.error('Schedule fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const switchTab = (idx: 0 | 1) => {
        setActiveTab(idx);
        Animated.spring(indicatorLeft, {
            toValue: idx === 0 ? 0 : 1,
            useNativeDriver: false,
            damping: 20,
            stiffness: 160,
        }).start();
    };

    const data = activeTab === 0 ? nowShowing : comingSoon;

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView edges={['top']} style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Lịch chiếu rạp</Text>
                        <Text style={styles.headerSub}>Cập nhật phim mới nhất tại rạp</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <Ionicons name="film-outline" size={18} color="#F4C84A" />
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabRow}>
                    {TABS.map((tab, idx) => (
                        <Pressable
                            key={tab}
                            style={[styles.tabBtn, activeTab === idx && styles.tabBtnActive]}
                            onPress={() => switchTab(idx as 0 | 1)}
                        >
                            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                                {tab}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <View style={styles.loadingPulse} />
                        {[...Array(4)].map((_, i) => (
                            <View key={i} style={styles.skeletonCard} />
                        ))}
                    </View>
                ) : (
                    <View style={{ flex: 1, paddingHorizontal: 16 }}>
                        <FlashList
                            data={data}
                            keyExtractor={(item) => item._id || item.slug}
                            renderItem={({ item }) => <MovieRow item={item} />}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4C84A" />
                            }
                            contentContainerStyle={{ paddingBottom: 120 }}
                            showsVerticalScrollIndicator={false}
                            estimatedItemSize={150} // Approximate height of MovieRow card + margin
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.2)" />
                                    <Text style={styles.emptyText}>Không có dữ liệu</Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#09090f' },
    safe: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
    headerBadge: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: 'rgba(244,200,74,0.1)',
        borderWidth: 1, borderColor: 'rgba(244,200,74,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },

    tabRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },
    tabBtn: {
        flex: 1, paddingVertical: 10, alignItems: 'center',
        borderRadius: 11,
    },
    tabBtnActive: {
        backgroundColor: '#F4C84A',
    },
    tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#000' },

    listContent: { paddingHorizontal: 16, paddingBottom: 120 },

    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 12,
        overflow: 'hidden',
        padding: 12,
        gap: 12,
    },
    poster: {
        width: 90, height: 130, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        flexShrink: 0,
    },
    qualityBadge: {
        position: 'absolute',
        top: 12, left: 12,
        backgroundColor: 'rgba(244,200,74,0.9)',
        paddingHorizontal: 5, paddingVertical: 2,
        borderRadius: 5,
    },
    qualityText: { color: '#000', fontSize: 9, fontWeight: '800' },

    cardBody: { flex: 1, justifyContent: 'flex-start', gap: 4 },
    cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 21 },
    cardOrigin: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
    metaPill: {
        flexDirection: 'row', gap: 4, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    },
    metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    genres: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },

    watchBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#F4C84A',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
        alignSelf: 'flex-start', marginTop: 6,
    },
    watchBtnText: { color: '#000', fontSize: 12, fontWeight: '700' },

    loadingWrap: { paddingHorizontal: 16, gap: 12 },
    loadingPulse: {
        height: 130, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginBottom: 4,
    },
    skeletonCard: {
        height: 130, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 15 },
});
