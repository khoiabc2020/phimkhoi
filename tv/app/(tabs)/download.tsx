import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, useCallback, useEffect } from 'react';
import { getDownloads, removeDownload, DownloadItem } from '@/lib/downloads';
import { startQueue, deleteDownloadFolder } from '@/services/downloadManager';
import { COLORS } from '@/constants/theme';

const POLL_MS = 1500;

export default function DownloadScreen() {
    const [items, setItems] = useState<DownloadItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const load = useCallback(async () => {
        const list = await getDownloads();
        setItems(list);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
            startQueue();
        }, [load])
    );

    useEffect(() => {
        if (items.some((i) => i.episodes.some((e) => e.status === 'downloading' || e.status === 'pending'))) {
            const t = setInterval(load, POLL_MS);
            return () => clearInterval(t);
        }
    }, [items, load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        startQueue();
        setRefreshing(false);
    }, [load]);

    const isTV = Platform.isTV;
    const hasItems = items.length > 0;
    const downloading = items
        .filter((i) => i.episodes.some((e) => e.status === 'downloading' || e.status === 'pending'))
        .sort((a, b) => b.addedAt - a.addedAt);
    const finished = items
        .filter((i) => i.episodes.some((e) => e.status === 'done'))
        .sort((a, b) => b.addedAt - a.addedAt);

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safe}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tải xuống</Text>
                    {hasItems && (
                        <Pressable onPress={load} style={styles.iconBtn}>
                            <Ionicons name="refresh" size={22} color="rgba(255,255,255,0.8)" />
                        </Pressable>
                    )}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
                >
                    {isTV && (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="tv-outline" size={56} color="rgba(255,255,255,0.35)" />
                            </View>
                            <Text style={styles.emptyTitle}>Không khả dụng trên TV</Text>
                            <Text style={styles.emptySub}>Tính năng tải xuống chỉ dùng trên điện thoại/tablet. Trên TV bạn xem trực tuyến đầy đủ.</Text>
                        </View>
                    )}

                    {!isTV && !hasItems && (
                        <View style={styles.empty}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="cloud-download-outline" size={56} color="rgba(255,255,255,0.35)" />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có nội dung tải xuống</Text>
                            <Text style={styles.emptySub}>Vào trang phim và bấm nút tải để thêm tập hoặc phim.</Text>
                        </View>
                    )}

                    {!isTV && downloading.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionBar} />
                                <Text style={styles.sectionTitle}>Đang tải</Text>
                            </View>
                            {downloading.map((item) => (
                                <DownloadCard
                                    key={`${item.movieSlug}-${item.serverIndex}`}
                                    item={item}
                                    onRemove={async () => {
                                await deleteDownloadFolder(item.movieSlug);
                                await removeDownload(item.movieSlug);
                                load();
                            }}
                                    onPress={() => router.push(`/movie/${item.movieSlug}` as any)}
                                />
                            ))}
                        </View>
                    )}

                    {!isTV && finished.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionBar, { backgroundColor: 'rgba(34,197,94,0.6)' }]} />
                                <Text style={styles.sectionTitle}>Đã tải xong</Text>
                            </View>
                            {finished.map((item) => (
                                <DownloadCard
                                    key={`${item.movieSlug}-${item.serverIndex}`}
                                    item={item}
                                    onRemove={async () => {
                                await deleteDownloadFolder(item.movieSlug);
                                await removeDownload(item.movieSlug);
                                load();
                            }}
                                    onPress={() => router.push(`/movie/${item.movieSlug}` as any)}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function DownloadCard({
    item,
    onRemove,
    onPress,
}: {
    item: DownloadItem;
    onRemove: () => void;
    onPress: () => void;
}) {
    const doneCount = item.episodes.filter((e) => e.status === 'done').length;
    const total = item.episodes.length;
    const downloadingEp = item.episodes.find((e) => e.status === 'downloading');
    const progress = downloadingEp?.progress ?? 0;
    const isAllDone = doneCount === total && total > 0;

    const progressText = isAllDone
        ? `${doneCount}/${total} tập • Hoàn thành`
        : downloadingEp
          ? `${doneCount}/${total} tập • ${progress}%`
          : `${doneCount}/${total} tập`;

    return (
        <Pressable style={styles.card} onPress={onPress}>
            <Image source={{ uri: item.posterUrl }} style={styles.poster} contentFit="cover" />
            <View style={styles.cardPlay}>
                <Ionicons name="play" size={20} color="white" />
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.movieName}</Text>
                <View style={styles.cardMeta}>
                    <Ionicons name="download-outline" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.cardMetaText}>{progressText}</Text>
                </View>
            </View>
            <Pressable style={styles.cardRemove} onPress={onRemove}>
                <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
            </Pressable>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
    iconBtn: { padding: 8 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyIconWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    sectionBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: COLORS.accent },
    sectionTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    poster: { width: 72, height: 72 * (2 / 3), borderRadius: 10, backgroundColor: '#333' },
    cardPlay: {
        position: 'absolute',
        left: 12,
        top: 12,
        width: 72,
        height: 72 * (2 / 3),
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    cardBody: { flex: 1, marginLeft: 14 },
    cardTitle: { color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 4 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardMetaText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    cardRemove: { padding: 8 },
});
