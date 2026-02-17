import { View, Text, Pressable, Image, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';

const SettingItem = ({ icon, color, label, value, onPress, isLink = false }: any) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center bg-gray-900/50 p-4 mb-3 rounded-2xl border border-gray-800 active:bg-gray-800"
  >
    <View className={`w-10 h-10 rounded-full items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text className="text-white ml-4 flex-1 font-medium text-base">{label}</Text>
    {value && <Text className="text-gray-500 mr-2">{value}</Text>}
    {isLink && <Ionicons name="chevron-forward" size={18} color="#6b7280" />}
  </Pressable>
);

export default function ProfileScreen() {
  const webUrl = 'http://18.141.25.244';
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  if (!user) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 px-6 justify-center items-center">
          <View className="items-center p-8 bg-gray-900/50 rounded-3xl border border-gray-800 w-full">
            <View className="w-20 h-20 bg-yellow-500/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="person" size={40} color="#fbbf24" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">Xin chào!</Text>
            <Text className="text-gray-400 text-center mb-8">
              Đăng nhập để đồng bộ phim yêu thích, lịch sử xem và bình luận.
            </Text>

            <Pressable
              onPress={() => router.push('/(auth)/login' as any)}
              className="w-full bg-yellow-500 py-4 rounded-xl items-center mb-4 shadow-lg shadow-yellow-500/20"
            >
              <Text className="text-black font-bold text-lg">Đăng nhập</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/register' as any)}
              className="w-full bg-gray-800 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">Đăng ký tài khoản</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <Text className="text-white text-3xl font-bold mb-8">Cài đặt</Text>

          {/* Profile Card */}
          <View className="flex-row items-center mb-10">
            <View className="w-20 h-20 bg-gray-800 rounded-full items-center justify-center mr-5 overflow-hidden border-2 border-yellow-500 shadow-lg shadow-yellow-500/20">
              {user.image ? (
                <Image source={{ uri: user.image }} className="w-full h-full" />
              ) : (
                <Text className="text-yellow-500 text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text className="text-white text-xl font-bold mb-1">{user.name}</Text>
              <Text className="text-gray-400 text-sm mb-2">{user.email}</Text>
              <View className="bg-yellow-500/20 self-start px-2 py-0.5 rounded border border-yellow-500/30">
                <Text className="text-yellow-500 text-xs font-bold uppercase">{user.role || 'Member'}</Text>
              </View>
            </View>
          </View>

          {/* Account Section */}
          <Text className="text-gray-500 text-sm font-bold uppercase mb-4 ml-2">Tài khoản</Text>
          <SettingItem
            icon="heart"
            color="#ec4899"
            label="Phim yêu thích"
            isLink
            onPress={() => router.push('/favorites' as any)}
          />
          <SettingItem
            icon="time"
            color="#3b82f6"
            label="Lịch sử xem"
            isLink
            onPress={() => router.push('/history' as any)}
          />
          <SettingItem
            icon="key"
            color="#8b5cf6"
            label="Đổi mật khẩu"
            isLink
            onPress={() => Alert.alert("Thông báo", "Tính năng đang phát triển")}
          />

          {/* App Settings */}
          <Text className="text-gray-500 text-sm font-bold uppercase mb-4 mt-6 ml-2">Ứng dụng</Text>
          <View className="flex-row items-center bg-gray-900/50 p-4 mb-3 rounded-2xl border border-gray-800">
            <View className="w-10 h-10 rounded-full items-center justify-center bg-orange-500/20 mr-4">
              <Ionicons name="notifications" size={20} color="#f97316" />
            </View>
            <Text className="text-white flex-1 font-medium text-base">Thông báo</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: '#374151', true: '#fbbf24' }}
              thumbColor={notifEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>
          <SettingItem
            icon="globe"
            color="#10b981"
            label="Truy cập Website"
            isLink
            onPress={() => Linking.openURL(webUrl)}
          />

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center bg-red-500/10 p-4 mt-6 rounded-2xl border border-red-500/30 active:bg-red-500/20"
          >
            <View className="w-10 h-10 rounded-full items-center justify-center bg-red-500/20 mr-4">
              <Ionicons name="log-out" size={20} color="#ef4444" />
            </View>
            <Text className="text-red-500 flex-1 font-bold text-base">Đăng xuất</Text>
          </Pressable>

          <Text className="text-gray-600 text-center text-xs mt-8">
            Phiên bản 1.0.1 • Build 20240217
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
