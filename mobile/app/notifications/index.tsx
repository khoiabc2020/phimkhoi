import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <TouchableOpacity style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            </View>

            {/* Empty State */}
            <View style={styles.emptyContainer}>
                {/* Animated-style icon with glow */}
                <View style={styles.iconOuter}>
                    <LinearGradient
                        colors={['rgba(251,191,36,0.12)', 'rgba(251,191,36,0.03)']}
                        style={styles.iconGlow}
                    />
                    <View style={styles.iconInner}>
                        <Ionicons name="notifications-outline" size={36} color="rgba(255,255,255,0.5)" />
                    </View>
                </View>

                <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
                <Text style={styles.emptySubtitle}>
                    Bật thông báo để không bỏ lỡ{'\n'}tập phim mới và cập nhật
                </Text>

                <TouchableOpacity style={styles.enableBtn} activeOpacity={0.8}>
                    <Ionicons name="notifications" size={16} color="black" />
                    <Text style={styles.enableBtnText}>Bật thông báo</Text>
                </TouchableOpacity>
            </View>

            {/* Coming soon section */}
            <View style={styles.comingSoon}>
                <View style={styles.comingSoonItem}>
                    <View style={styles.comingSoonIcon}>
                        <Ionicons name="film-outline" size={18} color="#fbbf24" />
                    </View>
                    <View style={styles.comingSoonText}>
                        <Text style={styles.comingSoonTitle}>Tập mới</Text>
                        <Text style={styles.comingSoonDesc}>Thông báo khi phim yêu thích có tập mới</Text>
                    </View>
                </View>
                <View style={styles.comingSoonItem}>
                    <View style={styles.comingSoonIcon}>
                        <Ionicons name="star-outline" size={18} color="#fbbf24" />
                    </View>
                    <View style={styles.comingSoonText}>
                        <Text style={styles.comingSoonTitle}>Phim hot</Text>
                        <Text style={styles.comingSoonDesc}>Phim trending và được đánh giá cao</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { flex: 1, color: 'white', fontSize: 18, fontWeight: '700' },
    settingsBtn: { padding: 4 },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 14,
        marginTop: -60,
    },
    iconOuter: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    iconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    emptySubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    enableBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fbbf24',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 8,
    },
    enableBtnText: {
        color: 'black',
        fontSize: 14,
        fontWeight: '700',
    },

    comingSoon: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 2,
    },
    comingSoonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    comingSoonIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(251,191,36,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    comingSoonText: { flex: 1, gap: 2 },
    comingSoonTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
    comingSoonDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
});
