import { View, Text, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';

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

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 px-6">
        <Text className="text-white text-2xl font-bold mt-4">Cá nhân</Text>

        {user ? (
          <View className="mt-8 items-center">
            <View className="w-24 h-24 bg-gray-800 rounded-full items-center justify-center mb-4 overflow-hidden border-2 border-yellow-500">
              {user.image ? (
                <Image source={{ uri: user.image }} className="w-full h-full" />
              ) : (
                <Text className="text-yellow-500 text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text className="text-white text-xl font-bold">{user.name}</Text>
            <Text className="text-gray-400">{user.email}</Text>

            <View className="mt-6 w-full space-y-4">
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center bg-gray-800 p-4 rounded-xl active:bg-gray-700"
              >
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                <Text className="text-white ml-4 flex-1">Đăng xuất</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="mt-8 items-center p-6 bg-gray-900 rounded-2xl">
            <Ionicons name="person-circle-outline" size={64} color="#fbbf24" />
            <Text className="text-white text-lg font-bold mt-2">Chưa đăng nhập</Text>
            <Text className="text-gray-400 text-center mt-1 mb-6">Đăng nhập để đồng bộ phim yêu thích và lịch sử xem phim</Text>

            <View className="flex-row w-full space-x-4">
              <Pressable
                onPress={() => router.push('/(auth)/login')}
                className="flex-1 bg-yellow-500 p-3 rounded-xl items-center"
              >
                <Text className="text-black font-bold">Đăng nhập</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(auth)/register')}
                className="flex-1 bg-gray-700 p-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold">Đăng ký</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View className="mt-8 space-y-4">
          <Pressable
            onPress={() => router.push('/history')}
            className="flex-row items-center bg-gray-800 p-4 rounded-xl active:bg-gray-700"
          >
            <Ionicons name="time-outline" size={24} color="#fbbf24" />
            <Text className="text-white ml-4 flex-1">Lịch sử xem</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(webUrl)}
            className="flex-row items-center bg-gray-800 p-4 rounded-xl active:bg-gray-700"
          >
            <Ionicons name="globe-outline" size={24} color="#fbbf24" />
            <Text className="text-white ml-4 flex-1">Mở phiên bản web</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </Pressable>
          <View className="bg-gray-800/50 p-4 rounded-xl">
            <Text className="text-gray-400 text-sm">Phiên bản 1.0.0</Text>
            <Text className="text-gray-500 text-xs mt-1">Khôi Phim - Xem phim online</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
