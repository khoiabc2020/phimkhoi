import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const webUrl = 'http://18.141.25.244';

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 px-6">
        <Text className="text-white text-2xl font-bold mt-4">Cá nhân</Text>
        <View className="mt-8 space-y-4">
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
