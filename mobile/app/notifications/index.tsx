import {
    View, Text, Pressable, StyleSheet, Animated, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/constants/theme';

const ACCENT = COLORS.accent ?? '#F4C84A';

export default function NotificationsScreen() {
    const router = useRouter();

    // ── Entry Animations ────────────────────────────────────────────────────
    const iconScale = useRef(new Animated.Value(0.7)).current;
    const iconOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textY = useRef(new Animated.Value(12)).current;
    const btnOpacity = useRef(new Animated.Value(0)).current;
    const btnY = useRef(new Animated.Value(16)).current;

    // Button press scale
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            // 1. Icon appears
            Animated.parallel([
                Animated.spring(iconScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            // 2. Text fades in
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(textY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // 3. Button slides up
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

    return (
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safe} edges={['top']}>

                {/*── Header ──────────────────────────────────────────────────*/}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
                        <Feather name="arrow-left" size={22} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                    </Pressable>

                    <Text style={styles.headerTitle}>Thông báo</Text>

                    <Pressable hitSlop={12} style={styles.iconBtn}>
                        <Feather name="settings" size={22} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                    </Pressable>
                </View>

                {/*── Empty State ─────────────────────────────────────────────*/}
                <View style={styles.body}>

                    {/* Liquid Glow Icon */}
                    <Animated.View style={[
                        styles.iconWrapper,
                        { opacity: iconOpacity, transform: [{ scale: iconScale }] }
                    ]}>
                        <View style={styles.glowOuter}>
                            <View style={styles.glowInner}>
                                <Feather
                                    name="bell"
                                    size={32}
                                    color={`rgba(244,200,74,0.8)`}
                                    strokeWidth={1.5}
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Title + Sub */}
                    <Animated.View style={[
                        styles.textBlock,
                        { opacity: textOpacity, transform: [{ translateY: textY }] }
                    ]}>
                        <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                        <Text style={styles.emptySub}>
                            Bật thông báo để không bỏ lỡ{'\n'}tập phim mới và cập nhật
                        </Text>
                    </Animated.View>

                    {/* CTA Button */}
                    <Animated.View style={[
                        { opacity: btnOpacity, transform: [{ translateY: btnY }, { scale: btnScale }] }
                    ]}>
                        <Pressable
                            style={styles.btn}
                            onPressIn={onPressIn}
                            onPressOut={onPressOut}
                        >
                            <Feather name="bell" size={16} color="black" strokeWidth={2} />
                            <Text style={styles.btnText}>Bật thông báo</Text>
                        </Pressable>
                    </Animated.View>
                </View>

                {/*── Feature Items ───────────────────────────────────────────*/}
                <View style={styles.features}>
                    <FeatureItem
                        icon="film"
                        title="Tập mới"
                        sub="Thông báo khi phim yêu thích có tập mới"
                    />
                    <FeatureItem
                        icon="star"
                        title="Phim hot"
                        sub="Phim trending và được đánh giá cao"
                    />
                </View>

            </SafeAreaView>
        </View>
    );
}

function FeatureItem({ icon, title, sub }: { icon: any; title: string; sub: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Feather name={icon} size={20} color={`rgba(244,200,74,0.85)`} strokeWidth={1.5} />
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

    // Empty State body
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 0,
        marginTop: -40, // Optical center
    },

    // Liquid glow icon
    iconWrapper: { marginBottom: 20 },
    glowOuter: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(244,200,74,0.06)',
        alignItems: 'center', justifyContent: 'center',
        // Radial glow via shadow
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 0,
    },
    glowInner: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: 'rgba(244,200,74,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(244,200,74,0.12)',
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
        marginTop: 40,
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
        backgroundColor: 'rgba(244,200,74,0.08)',
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
});
