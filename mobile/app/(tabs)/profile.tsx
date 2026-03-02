
import { View, Text, Pressable, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { CONFIG } from '@/constants/config';

const APP_VERSION = '1.0.3';
const APP_BUILD = 4;

interface UpdateInfo {
  version: string;
  build: number;
  download_url: string;
  force_update?: boolean;
}

const ProfileMenuItem = ({
  icon, label, sublabel, onPress, isDestructive = false, badge
}: {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; isDestructive?: boolean; badge?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14,
      backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
      marginBottom: 2,
    })}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDestructive ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
      }}>
        <Ionicons
          name={icon as any}
          size={20}
          color={isDestructive ? '#ef4444' : 'rgba(255,255,255,0.85)'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: isDestructive ? '#ef4444' : 'white', fontSize: 15, fontWeight: '600' }}>
          {label}
        </Text>
        {sublabel && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{sublabel}</Text>
        )}
      </View>
    </View>
    {badge ? (
      <View style={{ backgroundColor: '#F4C84A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
        <Text style={{ color: '#0a0d14', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
      </View>
    ) : (
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
    )}
  </Pressable>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginTop: 16, paddingHorizontal: 16 }}>
    {title}
  </Text>
);

export default function ProfileScreen() {
  const webUrl = 'https://khoiphim.io.vn';
  const { user, logout } = useAuth();
  const router = useRouter();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      setChecking(true);
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/version`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data: UpdateInfo = await res.json();
        if (data.build > APP_BUILD) setUpdateInfo(data);
      }
    } catch { } finally { setChecking(false); }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  // ─── Chưa đăng nhập ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0D12' }}>
        <StatusBar style="light" />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 24 }}>Tài khoản</Text>

            {/* Login Banner */}
            <View style={{ backgroundColor: 'rgba(244,200,74,0.08)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(244,200,74,0.2)', padding: 20, marginBottom: 28, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(244,200,74,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="person-outline" size={30} color="#F4C84A" />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
                Đăng nhập để lưu lịch sử xem, yêu thích và đồng bộ trên nhiều thiết bị
              </Text>
              <View style={{ gap: 10, width: '100%' }}>
                <Pressable
                  style={{ backgroundColor: '#F4C84A', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}
                  onPress={() => router.push('/(auth)/login' as any)}
                >
                  <Text style={{ color: '#0a0d14', fontWeight: '800', fontSize: 15 }}>Đăng nhập</Text>
                </Pressable>
                <Pressable
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                  onPress={() => router.push('/(auth)/register' as any)}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Đăng ký</Text>
                </Pressable>
              </View>
            </View>

            <SectionHeader title="Khám phá" />
            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <ProfileMenuItem icon="time-outline" label="Lịch sử xem" onPress={() => router.push('/history' as any)} />
              <ProfileMenuItem icon="heart-outline" label="Yêu thích" onPress={() => router.push('/(tabs)/favorites' as any)} />
              <ProfileMenuItem icon="bookmarks-outline" label="Xem sau" onPress={() => router.push('/watchlist' as any)} />
            </View>

            {/* Version */}
            <VersionCard updateInfo={updateInfo} checking={checking} onCheck={checkVersion} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Đã đăng nhập ─────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D12' }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 }}>

          {/* Header Profile */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4, marginBottom: 20 }}>
            <View style={{ width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(244,200,74,0.4)' }}>
              {user.image ? (
                <Image source={{ uri: user.image }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,200,74,0.12)' }}>
                  <Text style={{ color: '#F4C84A', fontSize: 24, fontWeight: '800' }}>{user.name?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 19, fontWeight: '800', marginBottom: 4 }}>{user.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(244,200,74,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={11} color="#F4C84A" />
                  <Text style={{ color: '#F4C84A', fontSize: 11, fontWeight: '700' }}>Thành viên</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Thư viện */}
          <SectionHeader title="Thư viện" />
          <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <ProfileMenuItem icon="time-outline" label="Lịch sử xem" sublabel="Tiếp tục xem dang dở" onPress={() => router.push('/history' as any)} />
            <ProfileMenuItem icon="heart-outline" label="Yêu thích" sublabel="Phim đã thêm vào yêu thích" onPress={() => router.push('/(tabs)/favorites' as any)} />
            <ProfileMenuItem icon="bookmarks-outline" label="Xem sau" sublabel="Danh sách phim của tôi" onPress={() => router.push('/watchlist' as any)} />
          </View>

          {/* Hỗ trợ */}
          <SectionHeader title="Hỗ trợ" />
          <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <ProfileMenuItem icon="chatbox-ellipses-outline" label="Góp ý" sublabel="Gửi phản hồi cho chúng tôi" onPress={() => Linking.openURL(`${webUrl}#gop-y`)} />
            <ProfileMenuItem icon="globe-outline" label="Trang web" sublabel={webUrl} onPress={() => Linking.openURL(webUrl)} />
          </View>

          {/* Phiên bản */}
          <SectionHeader title="Ứng dụng" />
          <VersionCard updateInfo={updateInfo} checking={checking} onCheck={checkVersion} />

          {/* Đăng xuất */}
          <SectionHeader title="Tài khoản" />
          <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <ProfileMenuItem icon="log-out-outline" label="Đăng xuất" isDestructive onPress={handleLogout} />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function VersionCard({ updateInfo, checking, onCheck }: { updateInfo: UpdateInfo | null; checking: boolean; onCheck: () => void }) {
  return (
    <View style={{
      backgroundColor: updateInfo ? 'rgba(244,200,74,0.08)' : 'rgba(255,255,255,0.03)',
      borderRadius: 16, borderWidth: 1,
      borderColor: updateInfo ? 'rgba(244,200,74,0.25)' : 'rgba(255,255,255,0.06)',
      padding: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: updateInfo ? 'rgba(244,200,74,0.15)' : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={updateInfo ? 'cloud-download-outline' : 'checkmark-circle-outline'} size={22} color={updateInfo ? '#F4C84A' : 'rgba(255,255,255,0.7)'} />
          </View>
          <View>
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>
              {updateInfo ? `Có phiên bản mới v${updateInfo.version}` : 'Phiên bản hiện tại'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 }}>
              v{APP_VERSION} (Build {APP_BUILD})
            </Text>
          </View>
        </View>
        {updateInfo ? (
          <Pressable
            onPress={() => Linking.openURL(updateInfo.download_url)}
            style={{ backgroundColor: '#F4C84A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ color: '#0a0d14', fontSize: 13, fontWeight: '800' }}>Cập nhật</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onCheck} disabled={checking} style={{ padding: 6 }}>
            <Ionicons name="refresh-outline" size={20} color={checking ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
