import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-black px-4">
            {/* Header */}
            <View className="flex-row items-center py-4 border-b border-white/10 mb-4">
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="white"
                    onPress={() => router.back()}
                />
                <Text className="text-white text-xl font-bold ml-4">Thông báo</Text>
            </View>

            {/* Empty State */}
            <View className="flex-1 justify-center items-center">
                <View className="bg-white/5 p-6 rounded-full mb-4">
                    <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
                </View>
                <Text className="text-white text-lg font-bold mb-2">Chưa có thông báo</Text>
                <Text className="text-gray-400 text-center px-8">
                    Bạn sẽ nhận được thông báo về các tập phim mới và tin tức cập nhật tại đây.
                </Text>
            </View>
        </SafeAreaView>
    );
}
