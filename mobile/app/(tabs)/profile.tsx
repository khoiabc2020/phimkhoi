import { View, Text, Pressable, Image, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { CONFIG } from '@/constants/config';
import ModernAlert, { AlertButton } from '@/components/ModernAlert';

const APP_VERSION = '1.0.7'; // Đồng bộ với /api/mobile/version
const APP_BUILD = 8;

interface UpdateInfo {
  version: string;
  build: number;
  download_url: string;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[{
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }, style]}>
      {children}
    </View>
  );
}

function MenuRow({ icon, label, sublabel, badge, onPress, danger = false }: {
  icon: string; label: string; sublabel?: string; badge?: string;
  onPress: () => void; danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, paddingHorizontal: 16,
        backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
      })}
    >
      <View style={{
        width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
        marginRight: 13,
      }}>
        <Ionicons name={icon as any} size={18} color={danger ? '#ef4444' : 'rgba(255,255,255,0.75)'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? '#ef4444' : 'white', fontSize: 15, fontWeight: '600' }}>{label}</Text>
        {sublabel && <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 }}>{sublabel}</Text>}
      </View>
      {badge ? (
        <View style={{ backgroundColor: '#263243', borderWidth: 1, borderColor: '#33455F', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: '#d8e3f2', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.15)" />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 63 }} />;
}

export default function ProfileScreen() {
  const webUrl = 'https://khoiphim.io.vn';
  const { user, logout } = useAuth();
  const router = useRouter();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    buttons?: AlertButton[];
  }>({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string, buttons?: AlertButton[], type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAlertConfig({ visible: true, title, message, buttons, type });
  };

  useEffect(() => { checkVersion(false); }, []);

  const checkVersion = async (isManual = false) => {
    try {
      setChecking(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000); // 12s timeout
      let res;
      try {
        res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/version`, {
          headers: { 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (res && res.ok) {
        const data: UpdateInfo = await res.json();
        if (data.build > APP_BUILD) {
          setUpdateInfo(data);
          if (isManual) {
            showAlert('Cập nhật mới!', `v${data.version} đã sẵn sàng`, [
              { text: 'Để sau', style: 'cancel' },
              { text: 'Tải về & Cài đặt', onPress: () => handleDownloadAndInstall(data.download_url) }
            ], 'success');
          }
        } else if (isManual) {
          showAlert('Phiên bản mới nhất', 'Bạn đang dùng phiên bản mới nhất rồi!', undefined, 'success');
        }
      } else if (isManual) {
        showAlert('Lỗi', 'Không thể kiểm tra cập nhật. Vui lòng thử lại.', undefined, 'error');
      }
    } catch {
      // Chỉ show lỗi khi user chủ động nhấn nút, không hiện khi auto-check lúc mở app
      if (isManual) showAlert('Lỗi', 'Không thể kết nối máy chủ. Kiểm tra lại kết nối mạng.', undefined, 'warning');
    } finally { setChecking(false); }
  };

  const handleDownloadAndInstall = async (url: string) => {
    try {
      setDownloading(true);
      setDownloadProgress(0);

      const fileUri = `${FileSystem.documentDirectory}update.apk`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result && result.uri) {
        // Lấy content URi qua FileProvider
        const cUri = await FileSystem.getContentUriAsync(result.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: cUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.android.package-archive'
        });
      }

    } catch (error) {
      console.error(error);
      showAlert('Lỗi tải xuống', 'Không thể tải bản cập nhật, vui lòng thử lại sau', undefined, 'error');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleLogout = () => {
    showAlert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ], 'warning');
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#05060a' }}>
        <StatusBar style="light" />
        {/* Background gradient */}
        <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
          <LinearGradient colors={['#0d0a1f', '#05060a']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%' }} />
          <View style={{ position: 'absolute', top: -60, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(143,167,197,0.08)' }} />
        </View>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 }}>Tài khoản</Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 28 }}>Đăng nhập để đồng bộ mọi thứ</Text>

            {/* Hero sign-in card */}
            <GlassCard style={{ padding: 24, marginBottom: 24, alignItems: 'center' }}>
              <LinearGradient
                colors={['rgba(143,167,197,0.14)', 'transparent']}
                style={{ position: 'absolute', inset: 0, borderRadius: 20 }}
              />
              <View style={{
                width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(143,167,197,0.14)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                borderWidth: 1, borderColor: 'rgba(143,167,197,0.3)'
              }}>
                <Ionicons name="person-outline" size={32} color="#8FA7C5" />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Chưa đăng nhập</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                Lưu lịch sử xem, yêu thích và đồng bộ trên mọi thiết bị của bạn.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{ width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}
              >
                <LinearGradient
                  colors={['#263243', '#32445b']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#33455F' }}
                >
                  <Text style={{ color: '#d8e3f2', fontWeight: '800', fontSize: 15 }}>Đăng nhập</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Tạo tài khoản</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Stats preview */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              {[{ icon: 'time-outline', label: 'Lịch sử', path: '/history' },
              { icon: 'heart-outline', label: 'Yêu thích', path: '/(tabs)/favorites' },
              { icon: 'bookmarks-outline', label: 'Xem sau', path: '/watchlist' }].map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push(item.path as any)}
                  style={{ flex: 1 }}
                >
                  <GlassCard style={{ padding: 14, alignItems: 'center' }}>
                    <Ionicons name={item.icon as any} size={22} color="rgba(255,255,255,0.5)" style={{ marginBottom: 6 }} />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' }}>{item.label}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            {/* App version */}
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="information-circle-outline" size={22} color="rgba(255,255,255,0.6)" />
                </View>
                <View>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>CINEFLIX</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>v{APP_VERSION} · © 2026</Text>
                </View>
              </View>
            </GlassCard>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  const initials = user.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <View style={{ flex: 1, backgroundColor: '#05060a' }}>
      <StatusBar style="light" />
      {/* Background */}
      <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
        <LinearGradient colors={['#0d0a1f', '#05060a']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }} />
        <View style={{ position: 'absolute', top: -40, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(143,167,197,0.08)' }} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>Tài khoản</Text>
          </View>

          {/* Profile Card — iOS 26 Hero */}
          <GlassCard style={{ padding: 20, marginBottom: 16 }}>
            <LinearGradient
              colors={['rgba(143,167,197,0.14)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, borderRadius: 20 }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <View style={{
                width: 68, height: 68, borderRadius: 34,
                borderWidth: 2.5, borderColor: 'rgba(143,167,197,0.45)',
                overflow: 'hidden',
              }}>
                {user.image ? (
                  <Image source={{ uri: user.image }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <LinearGradient
                    colors={['rgba(143,167,197,0.28)', 'rgba(143,167,197,0.1)']}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#c7d7ea', fontSize: 24, fontWeight: '800' }}>{initials}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 }}>{user.name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }} numberOfLines={1}>{user.email}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={{ backgroundColor: 'rgba(143,167,197,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(143,167,197,0.32)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={user.role === 'admin' ? 'shield' : 'star'} size={11} color="#8FA7C5" />
                    <Text style={{ color: '#c7d7ea', fontSize: 11, fontWeight: '700' }}>
                      {user.role === 'admin' ? 'Quản trị' : 'Thành viên'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Yêu thích', value: user.favorites?.length ?? 0 },
                { label: 'Xem sau', value: user.watchlist?.length ?? 0 },
                { label: 'Lịch sử', value: user.history?.length ?? 0 },
              ].map((s, i) => (
                <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{s.label}</Text>
                  {i < 2 && <View style={{ position: 'absolute', right: 0, top: 4, bottom: 4, width: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />}
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Thư viện */}
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>Thư viện</Text>
          <GlassCard style={{ marginBottom: 16 }}>
            <MenuRow icon="time-outline" label="Lịch sử xem" sublabel="Tiếp tục xem dở" onPress={() => router.push('/history' as any)} />
            <Divider />
            <MenuRow icon="heart-outline" label="Yêu thích" sublabel="Phim đã thêm" onPress={() => router.push('/(tabs)/favorites' as any)} />
            <Divider />
            <MenuRow icon="bookmarks-outline" label="Xem sau" sublabel="Danh sách của tôi" onPress={() => router.push('/watchlist' as any)} />
          </GlassCard>

          {/* Hỗ trợ */}
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>Hỗ trợ</Text>
          <GlassCard style={{ marginBottom: 16 }}>
            <MenuRow icon="globe-outline" label="Trang web" sublabel="khoiphim.io.vn" onPress={() => Linking.openURL(webUrl)} />
            <Divider />
            <MenuRow icon="chatbox-ellipses-outline" label="Góp ý" sublabel="Gửi phản hồi" onPress={() => Linking.openURL(`${webUrl}#gop-y`)} />
          </GlassCard>

          {/* Ứng dụng */}
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 4 }}>Ứng dụng</Text>
          <GlassCard style={{ marginBottom: 16 }}>
            <Pressable
              onPress={() => checkVersion(true)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', padding: 16,
                backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
              })}
            >
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: updateInfo ? 'rgba(143,167,197,0.18)' : 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
                <Ionicons name={updateInfo ? 'cloud-download-outline' : 'checkmark-circle-outline'} size={18} color={updateInfo ? '#8FA7C5' : 'rgba(255,255,255,0.6)'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
                  {updateInfo ? `Bản mới v${updateInfo.version}` : 'Phiên bản mới nhất'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>Phiên bản {APP_VERSION} (Build {APP_BUILD})</Text>
              </View>
              {updateInfo ? (
                <TouchableOpacity onPress={() => handleDownloadAndInstall(updateInfo.download_url)} style={{ backgroundColor: '#263243', borderRadius: 8, borderWidth: 1, borderColor: '#33455F', paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#d8e3f2', fontSize: 12, fontWeight: '800' }}>Cập nhật</Text>
                </TouchableOpacity>
              ) : (
                <Ionicons name="refresh-outline" size={18} color={checking ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'} />
              )}
            </Pressable>
          </GlassCard>

          {/* Đăng xuất */}
          <GlassCard>
            <MenuRow icon="log-out-outline" label="Đăng xuất" danger onPress={handleLogout} />
          </GlassCard>

          <Text style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
            © 2026 CINEFLIX · Khôi Le
          </Text>
        </ScrollView>
      </SafeAreaView>
      <ModernAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
