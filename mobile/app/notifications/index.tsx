import {
    View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView, ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { COLORS } from '@/constants/theme';
import { CONFIG } from '@/constants/config';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/auth';
import { getNotifications, markNotificationsRead, AppNotification } from '@/services/api';

const ACCENT = COLORS.accent ?? '#E50914';
const APP_BUILD = 8;

interface UpdateInfo {
    version: string;
    build: number;
    download_url: string;
    change_log: string;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    const iconScale = useRef(new Animated.Value(0.7)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textY = useRef(new Animated.Value(12)).current;
    const btnOpacity = useRef(new Animated.Value(0)).current;
    const btnY = useRef(new Animated.Value(16)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    const checkVersion = async () => {
        try {
            const res = await apiFetch(`${CONFIG.BACKEND_URL}/api/mobile/version`, {
                headers: { 'Cache-Control': 'no-cache' },
                signal: AbortSignal.timeout(6000)
            });
            if (res.ok) {
                const data: UpdateInfo = await res.json();
                if (data.build > APP_BUILD) {
                    setUpdateInfo(data);
                }
            }
        } catch { }
    };

    const loadNotifications = useCallback(async () => {
        if (!token) return;
        setLoadingNotifs(true);
        try {
            const data = await getNotifications(token);
            setNotifications(data);
            // Mark all as read after loading
            if (data.some(n => !n.isRead)) {
                markNotificationsRead(token);
            }
        } finally {
            setLoadingNotifs(false);
        }
    }, [token]);

    useFocusEffect(useCallback(() => {
        loadNotifications();
    }, [loadNotifications]));

    useEffect(() => {
        checkVersion();
        Animated.sequence([
            Animated.parallel([
                Animated.spring(iconScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(textY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(btnOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
                Animated.timing(btnY, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const onPressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 20 }).start();
    };
    const onPressOut = () => {
        Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14 }).start();
    };

    const hasNotifications = notifications.length > 0;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
                        <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Thông báo</Text>
                    <View style={styles.iconBtn}>
                        {hasNotifications && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{notifications.length}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    {/* Update card */}
                    {updateInfo && (
                        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                            <View style={styles.updateCard}>
                                <View style={styles.updateHeader}>
                                    <View style={styles.updateIconWrap}>
                                        <Ionicons name="rocket" size={24} color="#0B0D12" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.updateTitle}>Có phiên bản mới!</Text>
                                        <Text style={styles.updateVersion}>v{updateInfo.version} đã sẵn sàng</Text>
                                    </View>
                                </View>
                                {updateInfo.change_log && (
                                    <View style={styles.changelogBox}>
                                        <Text style={styles.changelogText}>{updateInfo.change_log}</Text>
                                    </View>
                                )}
                                <Pressable
                                    style={styles.downloadBtn}
                                    onPress={() => Linking.openURL(updateInfo.download_url)}
                                >
                                    <Ionicons name="cloud-download-outline" size={18} color="#0B0D12" />
                                    <Text style={styles.downloadBtnText}>Cập nhật ngay</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Notifications list */}
                    {user && token ? (
                        loadingNotifs ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="small" color={ACCENT} />
                            </View>
                        ) : hasNotifications ? (
                            <View style={styles.notifList}>
                                <Text style={styles.sectionLabel}>Phim yêu thích cập nhật</Text>
                                {notifications.map((n) => (
                                    <Pressable
                                        key={n.id}
                                        style={[styles.notifCard, !n.isRead && styles.notifCardUnread]}
                                        onPress={() => n.movieSlug && router.push(`/movie/${n.movieSlug}` as any)}
                                    >
                                        {n.moviePoster ? (
                                            <Image
                                                source={{ uri: n.moviePoster }}
                                                style={styles.notifPoster}
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <View style={[styles.notifPoster, styles.notifPosterPlaceholder]}>
                                                <Feather name="film" size={20} color="rgba(255,255,255,0.3)" />
                                            </View>
                                        )}
                                        <View style={styles.notifContent}>
                                            <Text style={styles.notifTitle} numberOfLines={2}>
                                                {n.movieName || n.title}
                                            </Text>
                                            {n.newEpisode ? (
                                                <Text style={styles.notifEpisode}>
                                                    <Ionicons name="play-circle" size={12} color={ACCENT} /> {n.newEpisode}
                                                </Text>
                                            ) : n.message ? (
                                                <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
                                            ) : null}
                                            <Text style={styles.notifTime}>{n.updatedAt}</Text>
                                        </View>
                                        {!n.isRead && <View style={styles.unreadDot} />}
                                    </Pressable>
                                ))}
                            </View>
                        ) : !updateInfo ? (
                            <EmptyState
                                iconScale={iconScale} iconOpacity={iconOpacity}
                                textOpacity={textOpacity} textY={textY}
                                btnOpacity={btnOpacity} btnY={btnY} btnScale={btnScale}
                                onPressIn={onPressIn} onPressOut={onPressOut}
                            />
                        ) : null
                    ) : (
                        /* Not logged in */
                        <View style={styles.loginPrompt}>
                            <Ionicons name="person-outline" size={40} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.loginPromptText}>Đăng nhập để nhận thông báo</Text>
                            <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login' as any)}>
                                <Text style={styles.loginBtnText}>Đăng nhập</Text>
                            </Pressable>
                        </View>
                    )}

                    {/*── Feature Items ───────────────────────────────────────────*/}
                    <View style={styles.features}>
                        {(updateInfo || !hasNotifications) && (
                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, paddingHorizontal: 4 }}>
                                Cài đặt thông báo
                            </Text>
                        )}
                        <FeatureItem icon="film" title="Tập mới" sub="Thông báo khi phim yêu thích có tập mới" />
                        <FeatureItem icon="star" title="Phim hot" sub="Phim trending và được đánh giá cao" />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function EmptyState({ iconScale, iconOpacity, textOpacity, textY, btnOpacity, btnY, btnScale, onPressIn, onPressOut }: any) {
    return (
        <View style={styles.body}>
            <Animated.View style={[styles.iconWrapper, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
                <View style={styles.glowOuter}>
                    <View style={styles.glowInner}>
                        <Feather name="bell" size={32} color={`rgba(143,167,197,0.8)`} strokeWidth={1.5} />
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                <Text style={styles.emptySub}>Thêm phim vào yêu thích để nhận{'\n'}thông báo khi có tập mới</Text>
            </Animated.View>

            <Animated.View style={[{ opacity: btnOpacity, transform: [{ translateY: btnY }, { scale: btnScale }] }]}>
                <Pressable style={styles.btn} onPressIn={onPressIn} onPressOut={onPressOut}>
                    <Feather name="heart" size={16} color="black" strokeWidth={2} />
                    <Text style={styles.btnText}>Xem phim yêu thích</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

function FeatureItem({ icon, title, sub }: { icon: any; title: string; sub: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Feather name={icon} size={20} color={`rgba(143,167,197,0.85)`} strokeWidth={1.5} />
            </View>
            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSub}>{sub}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#09090f' },
    safe: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    iconBtn: {
        width: 36, height: 36,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    badge: {
        backgroundColor: ACCENT,
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    // Loading
    loadingWrap: { paddingVertical: 40, alignItems: 'center' },

    // Login prompt
    loginPrompt: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 40, gap: 12,
    },
    loginPromptText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
    loginBtn: {
        backgroundColor: ACCENT, borderRadius: 20,
        paddingHorizontal: 28, paddingVertical: 10,
    },
    loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Notifications list
    notifList: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
    sectionLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1.2,
        marginBottom: 4,
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    notifCardUnread: {
        backgroundColor: 'rgba(229,9,20,0.06)',
        borderColor: 'rgba(229,9,20,0.15)',
    },
    notifPoster: {
        width: 56, height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    notifPosterPlaceholder: {
        alignItems: 'center', justifyContent: 'center',
    },
    notifContent: { flex: 1, gap: 4 },
    notifTitle: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 },
    notifEpisode: { color: ACCENT, fontSize: 12, fontWeight: '600' },
    notifMessage: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 17 },
    notifTime: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 },
    unreadDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: ACCENT, alignSelf: 'flex-start', marginTop: 4,
    },

    // Empty State body
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 0,
        marginTop: -40,
        minHeight: 300,
    },

    // Liquid glow icon
    iconWrapper: { marginBottom: 20 },
    glowOuter: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(143,167,197,0.06)',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 0,
    },
    glowInner: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: 'rgba(143,167,197,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },

    textBlock: { alignItems: 'center', marginBottom: 24 },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    emptySub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },

    // CTA Button
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        paddingHorizontal: 32,
        borderRadius: 24,
        backgroundColor: ACCENT,
    },
    btnText: {
        color: 'black',
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: -0.1,
    },

    // Feature items
    features: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        gap: 8,
        marginTop: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    featureIcon: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: 'rgba(143,167,197,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    featureText: { flex: 1 },
    featureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    featureSub: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        lineHeight: 17,
    },

    // Update Card
    updateCard: {
        backgroundColor: 'rgba(143,167,197,0.08)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.25)',
        marginBottom: 16,
    },
    updateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    updateIconWrap: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(143,167,197,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    updateTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    updateVersion: { color: '#E50914', fontSize: 14, fontWeight: '600' },
    changelogBox: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    changelogText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 },
    downloadBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#E50914', borderRadius: 14,
        paddingVertical: 14, width: '100%',
    },
    downloadBtnText: { color: '#0B0D12', fontSize: 15, fontWeight: '700' },
});
