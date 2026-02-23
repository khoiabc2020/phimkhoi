import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 8, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.9)' }}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Thông báo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,0.35)',
            backgroundColor: 'rgba(15,23,42,0.95)',
          }}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
            Chưa có thông báo nào
          </Text>
          <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 13, lineHeight: 20 }}>
            Khi có tập phim mới, cập nhật tính năng hoặc gợi ý dành riêng cho bạn, thông báo sẽ xuất hiện ở đây.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

