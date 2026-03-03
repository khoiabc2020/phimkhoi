import React, { useEffect, useState } from 'react';
import {
    View, Text, Modal, Pressable, StyleSheet, Linking, Platform,
    ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Version hiện tại của ứng dụng — cập nhật mỗi lần build
const CURRENT_VERSION = '1.0.2';
const CURRENT_BUILD = 3;

const SKIP_KEY = 'skipped_update_build';

interface UpdateInfo {
    version: string;
    build: number;
    force_update: boolean;
    download_url: string;
    change_log: string;
}

interface Props {
    silent?: boolean; // Nếu true: chỉ hiện dialog khi có update mới
}

export default function UpdateChecker({ silent = true }: Props) {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        checkForUpdate();
    }, [silent]);

    const checkForUpdate = async () => {
        try {
            setChecking(true);
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/version`, {
                headers: { 'Cache-Control': 'no-cache' },
                signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return;
            const data: UpdateInfo = await res.json();

            // Kiểm tra xem người dùng đã bỏ qua build này chưa (chỉ xét khi chạy ngầm)
            const skipped = await AsyncStorage.getItem(SKIP_KEY);
            if (silent && !data.force_update && skipped === String(data.build)) return;

            // So sánh build number - Bấm tay (silent=false) thì luôn báo k kể skip
            if (data.build > CURRENT_BUILD || !silent) {
                setUpdateInfo(data);
                setVisible(true);
            }
        } catch (e) {
            // Fail silently — không ảnh hưởng trải nghiệm người dùng
        } finally {
            setChecking(false);
        }
    };

    const handleUpdate = async () => {
        if (!updateInfo) return;
        try {
            await Linking.openURL(updateInfo.download_url);
        } catch {
            Alert.alert('Không thể tải', 'Vui lòng tải thủ công từ trang web của chúng tôi.');
        }
    };

    const handleSkip = async () => {
        if (!updateInfo) return;
        await AsyncStorage.setItem(SKIP_KEY, String(updateInfo.build));
        setVisible(false);
    };

    if (!updateInfo) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !updateInfo?.force_update && setVisible(false)}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.iconWrap}>
                        <Ionicons name="rocket-outline" size={40} color="#E6BF5C" />
                    </View>

                    <Text style={styles.title}>Phiên bản mới!</Text>
                    <Text style={styles.versionText}>v{updateInfo.version} đã sẵn sàng</Text>

                    {/* Changelog */}
                    {updateInfo.change_log && (
                        <View style={styles.changelogBox}>
                            <Text style={styles.changelogTitle}>Thay đổi:</Text>
                            <Text style={styles.changelogText}>{updateInfo.change_log}</Text>
                        </View>
                    )}

                    {/* Buttons */}
                    <Pressable style={styles.updateBtn} onPress={handleUpdate}>
                        <Ionicons name="cloud-download-outline" size={18} color="#0B0D12" style={{ marginRight: 8 }} />
                        <Text style={styles.updateBtnText}>Tải về & Cài đặt</Text>
                    </Pressable>

                    {!updateInfo.force_update && (
                        <Pressable style={styles.skipBtn} onPress={handleSkip}>
                            <Text style={styles.skipText}>Bỏ qua phiên bản này</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: {
        backgroundColor: '#13161f', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360,
        borderWidth: 1, borderColor: 'rgba(244,200,74,0.25)', alignItems: 'center',
    },
    iconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(244,200,74,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    title: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 4 },
    versionText: { color: '#E6BF5C', fontSize: 15, fontWeight: '600', marginBottom: 16 },
    changelogBox: {
        width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 14, marginBottom: 20,
    },
    changelogTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
    changelogText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 },
    updateBtn: {
        width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#E6BF5C', borderRadius: 14, paddingVertical: 14, marginBottom: 10,
    },
    updateBtnText: { color: '#0B0D12', fontSize: 16, fontWeight: '700' },
    skipBtn: { paddingVertical: 10 },
    skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});
