
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
    className="flex-row items-center justify-between py-4 px-4 border-b border-white/5 active:bg-white/10"
  >
    <View className="flex-row items-center gap-4">
      <Ionicons name={icon} size={20} color={isDestructive ? '#ef4444' : 'rgba(255,255,255,0.7)'} />
      <Text className={`text-[15px] font-medium ${isDestructive ? 'text-red-500' : 'text-white'}`}>
        {label}
      </Text>
    </View>
    {!isDestructive && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />}
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
        <SafeAreaView className="flex-1 px-5 pt-8">
          <View className="items-center mb-10">
            <Text className="text-[#F4C84A] text-3xl font-black tracking-tighter mb-2">MOVIEBOX</Text>
            <Text className="text-gray-500 text-sm">Đăng nhập để đồng bộ lịch sử & yêu thích</Text>
          </View>

          {/* Auth Buttons */}
          <View className="gap-4">
            <Pressable
              className="w-full bg-[#F4C84A] py-4 rounded-full items-center justify-center shadow-lg shadow-yellow-500/20"
              onPress={() => router.push('/(auth)/login' as any)}
            >
              <Text className="text-black font-extrabold text-base uppercase tracking-wide">Đăng nhập</Text>
            </Pressable>

            <Pressable
              className="w-full bg-white/10 py-4 rounded-full items-center justify-center border border-white/10"
              onPress={() => router.push('/(auth)/register' as any)}
            >
              <Text className="text-white font-bold text-base uppercase tracking-wide">Đăng ký</Text>
            </Pressable>
          </View>

          {/* Footer Links */}
          <View className="mt-auto pb-10 gap-4">
            <ProfileMenuItem icon="shield-checkmark-outline" label="Chính sách bảo mật" onPress={() => Linking.openURL(webUrl)} />
            <ProfileMenuItem icon="help-circle-outline" label="Trợ giúp & Góp ý" onPress={() => Linking.openURL(webUrl)} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

          {/* User Card */}
          <View className="flex-row items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
            <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F4C84A] mr-4 bg-gray-800">
              {user.image ? (
                <Image source={{ uri: user.image }} className="w-full h-full" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-gray-900">
                  <Text className="text-xl font-bold text-[#F4C84A]">{user.name?.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-xl font-black tracking-tight">{user.name}</Text>
                <View className="bg-[#F4C84A] px-2 py-0.5 rounded flex-row items-center">
                  <Text className="text-black text-[10px] font-black uppercase">Member</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-1 font-medium tracking-wider">ID: {user.id ? user.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}</Text>
            </View>
          </View>

          {/* Big White "Manage Account" Button (Synced Design) */}
          <Pressable
            className="w-full bg-white py-4 rounded-xl items-center mb-10 shadow-lg active:scale-95 transition-all"
            onPress={() => Alert.alert("Thông báo", "Chức năng đang được đồng bộ với Web")}
          >
            <Text className="text-black font-extrabold text-base">Quản lý tài khoản</Text>
          </Pressable>

          {/* Menu Groups */}
          <View className="space-y-6">

            {/* Group 1: Personal */}
            <View>
              <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-2">Cá nhân</Text>
              <View className="bg-white/5 rounded-2xl overflow-hidden">
                <ProfileMenuItem icon="time-outline" label="Đang xem" onPress={() => router.push('/history' as any)} />
                <View className="h-[1px] bg-white/5 mx-4" />
                <ProfileMenuItem icon="add-circle-outline" label="Danh sách của tôi" onPress={() => router.push('/watchlist' as any)} />
                <View className="h-[1px] bg-white/5 mx-4" />
                <ProfileMenuItem icon="heart-outline" label="Yêu thích" onPress={() => router.push('/favorites' as any)} />
              </View>
            </View>

            {/* Group 2: System */}
            <View>
              <Text className="text-gray-500 text-xs font-bold uppercase mb-2 ml-2">Hệ thống</Text>
              <View className="bg-white/5 rounded-2xl overflow-hidden">
                <ProfileMenuItem icon="tv-outline" label="Đăng nhập SmartTV" onPress={() => Alert.alert("Coming Soon", "Tính năng SmartTV đang phát triển")} />
                <View className="h-[1px] bg-white/5 mx-4" />
                <ProfileMenuItem icon="document-text-outline" label="Hợp đồng & Chính sách" onPress={() => Linking.openURL(webUrl)} />
                <View className="h-[1px] bg-white/5 mx-4" />
                <ProfileMenuItem icon="lock-closed-outline" label="Chính sách bảo mật" onPress={() => Linking.openURL(webUrl)} />
                <View className="h-[1px] bg-white/5 mx-4" />
                <ProfileMenuItem icon="chatbubble-ellipses-outline" label="Góp ý & Báo lỗi" onPress={() => Linking.openURL(webUrl)} />
              </View>
            </View>

            {/* Logout */}
            <Pressable
              className="flex-row items-center justify-center gap-2 py-4 mt-4"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-500 font-bold text-base">Đăng xuất</Text>
            </Pressable>

          </View>

          <Text className="text-gray-800 text-center text-[10px] font-bold mt-12 uppercase tracking-widest">
            MovieBox Mobile v2.0
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
