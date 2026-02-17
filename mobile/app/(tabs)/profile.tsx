
import { View, Text, Pressable, Image, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const ProfileMenuItem = ({ icon, label, onPress, isDestructive = false }: any) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-gray-800 active:bg-white/5 px-2"
  >
    <View className="flex-row items-center gap-4">
      <Ionicons name={icon} size={22} color={isDestructive ? '#ef4444' : 'white'} />
      <Text className={`text-base font-medium ${isDestructive ? 'text-red-500' : 'text-white'}`}>
        {label}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#6b7280" />
  </Pressable>
);

export default function ProfileScreen() {
  const webUrl = 'http://18.141.25.244';
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  if (!user) {
    return (
      <View className="flex-1 bg-[#0a0a0a]">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 justify-center items-center px-6">
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-gray-800 rounded-full items-center justify-center mb-4 border border-gray-700">
              <Ionicons name="person" size={40} color="#6b7280" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">Chưa đăng nhập</Text>
            <Text className="text-gray-400 text-center text-sm px-8">
              Đăng nhập để lưu phim, xem lịch sử và đồng bộ dữ liệu.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/login' as any)}
            className="w-full bg-white py-3.5 rounded-full items-center mb-4"
          >
            <Text className="text-black font-bold text-base">Đăng nhập</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

          {/* Header Profile */}
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 rounded-full overflow-hidden border border-gray-700 mr-4 bg-gray-800">
              {user.image ? (
                <Image source={{ uri: user.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-gray-800">
                  <Text className="text-xl font-bold text-gray-400">{user.name?.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-lg font-bold">{user.name}</Text>
                <View className="bg-green-500/20 px-2 py-0.5 rounded">
                  <Text className="text-green-500 text-[10px] font-bold uppercase">Member</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-1">ID: {user.id ? user.id.slice(0, 8) : 'Unknown'}</Text>
            </View>
          </View>

          {/* Manage Account Button */}
          <Pressable
            className="w-full bg-white py-3 rounded-xl items-center mb-8 active:opacity-90"
            onPress={() => Alert.alert("Thông báo", "Tính năng quản lý tài khoản đang phát triển")}
          >
            <Text className="text-black font-bold text-sm">Quản lý tài khoản</Text>
          </Pressable>

          {/* Menu List */}
          <View className="mb-6">
            <ProfileMenuItem
              icon="time-outline"
              label="Đang xem"
              onPress={() => router.push('/history' as any)}
            />
            <ProfileMenuItem
              icon="add-outline"
              label="Danh sách phim của tôi"
              onPress={() => router.push('/favorites' as any)}
            />
            <ProfileMenuItem
              icon="heart-outline"
              label="Yêu thích"
              onPress={() => router.push('/favorites' as any)}
            />
          </View>

          <View className="mb-6">
            <ProfileMenuItem
              icon="tv-outline"
              label="Đăng nhập SmartTV"
              onPress={() => Alert.alert("Coming Soon", "Tính năng SmartTV đang phát triển")}
            />
            <ProfileMenuItem
              icon="shield-checkmark-outline"
              label="Hợp đồng và Chính sách"
              onPress={() => Linking.openURL(webUrl)}
            />
            <ProfileMenuItem
              icon="lock-closed-outline"
              label="Chính sách bảo mật"
              onPress={() => Linking.openURL(webUrl)}
            />
            <ProfileMenuItem
              icon="chatbox-ellipses-outline"
              label="Góp ý"
              onPress={() => Linking.openURL(webUrl)}
            />
          </View>

          {/* Logout */}
          <View className="mt-4">
            <ProfileMenuItem
              icon="log-out-outline"
              label="Đăng xuất"
              isDestructive
              onPress={handleLogout}
            />
          </View>

          <Text className="text-gray-700 text-center text-xs mt-12 mb-4">
            Version 1.2.0 • Build 2024
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
