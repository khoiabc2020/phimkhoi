import React from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { checkAppVersion } from '@/services/api';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const checkUpdate = async () => {
        const versionInfo = await checkAppVersion();
        if (versionInfo) {
            const currentVersion = '1.0.0'; // Should match app.json
            if (versionInfo.version !== currentVersion) {
                alert(`Có bản cập nhật mới: ${versionInfo.version}\n${versionInfo.change_log}\n\nVui lòng tải về cài đặt.`);
                if (versionInfo.download_url) Linking.openURL(versionInfo.download_url);
            } else {
                alert("Bạn đang sử dụng phiên bản mới nhất.");
            }
        } else {
            alert("Không thể kiểm tra cập nhật.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-white/10">
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="white"
                    onPress={() => router.back()}
                />
                <Text className="text-white text-xl font-bold ml-4">Cài đặt</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {/* Account Section */}
                <View className="mb-6">
                    <Text className="text-gray-400 text-sm font-bold mb-3 uppercase">Tài khoản</Text>
                    <View className="bg-gray-900 rounded-xl overflow-hidden">
                        {user ? (
                            <View className="p-4 flex-row items-center border-b border-gray-800">
                                <View className="w-12 h-12 bg-primary/20 rounded-full justify-center items-center mr-4">
                                    <Text className="text-primary font-bold text-lg">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">{user.name}</Text>
                                    <Text className="text-gray-400 text-sm">{user.email}</Text>
                                </View>
                            </View>
                        ) : (
                            <Pressable
                                className="p-4 flex-row items-center justify-between active:bg-gray-800"
                                onPress={() => router.push('/(auth)/login')}
                            >
                                <Text className="text-white font-medium">Đăng nhập / Đăng ký</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* General Settings */}
                <View className="mb-6">
                    <Text className="text-gray-400 text-sm font-bold mb-3 uppercase">Chung</Text>
                    <View className="bg-gray-900 rounded-xl overflow-hidden">
                        <View className="p-4 flex-row items-center justify-between border-b border-gray-800">
                            <View className="flex-row items-center">
                                <Ionicons name="moon-outline" size={22} color="white" style={{ marginRight: 12 }} />
                                <Text className="text-white font-medium">Chế độ tối</Text>
                            </View>
                            <Switch value={true} trackColor={{ false: '#767577', true: '#fbbf24' }} thumbColor={'#f4f3f4'} />
                        </View>
                        <View className="p-4 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Ionicons name="notifications-outline" size={22} color="white" style={{ marginRight: 12 }} />
                                <Text className="text-white font-medium">Thông báo</Text>
                            </View>
                            <Switch value={true} trackColor={{ false: '#767577', true: '#fbbf24' }} thumbColor={'#f4f3f4'} />
                        </View>
                        <Pressable
                            className="p-4 flex-row items-center justify-between active:bg-gray-800"
                            onPress={checkUpdate}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="cloud-download-outline" size={22} color="white" style={{ marginRight: 12 }} />
                                <Text className="text-white font-medium">Kiểm tra cập nhật</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </Pressable>
                    </View>
                </View>

                {/* About Info */}
                <View className="mb-6">
                    <Text className="text-gray-400 text-sm font-bold mb-3 uppercase">Thông tin</Text>
                    <View className="bg-gray-900 rounded-xl overflow-hidden">
                        <View className="p-4 flex-row items-center justify-between border-b border-gray-800">
                            <Text className="text-white font-medium">Phiên bản</Text>
                            <Text className="text-gray-400">1.0.0 (Build 1)</Text>
                        </View>
                        <Pressable className="p-4 flex-row items-center justify-between active:bg-gray-800">
                            <Text className="text-white font-medium">Điều khoản sử dụng</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </Pressable>
                        <Pressable className="p-4 flex-row items-center justify-between active:bg-gray-800">
                            <Text className="text-white font-medium">Chính sách bảo mật</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </Pressable>
                    </View>
                </View>

                {/* Logout Button */}
                {user && (
                    <Pressable
                        className="bg-red-500/10 mb-8 p-4 rounded-xl flex-row justify-center items-center border border-red-500/20 active:bg-red-500/20"
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                        <Text className="text-red-500 font-bold">Đăng xuất</Text>
                    </Pressable>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

