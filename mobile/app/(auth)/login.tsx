import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '855740529726-jtgo46gn63ce2mcgdm9fmsu7bndbjekj.apps.googleusercontent.com';

export default function AuthScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const showAlert = (title: string, message: string, buttons?: { text: string; onPress?: () => void }[]) => {
        Alert.alert(title, message, buttons ?? [{ text: 'OK' }]);
    };

    const parseResponseJson = async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();
        if (!contentType.includes('application/json')) {
            throw new Error('Server phản hồi không hợp lệ, vui lòng thử lại.');
        }
        try {
            return JSON.parse(raw);
        } catch {
            throw new Error('Không đọc được dữ liệu từ server.');
        }
    };

    // Android OAuth Client ID (cần tạo riêng trong Google Console cho Android app)
    // Package name: com.phimkhoi.mobile, SHA-1 cần được thêm vào Google Console
    const GOOGLE_ANDROID_CLIENT_ID = '855740529726-jtgo46gn63ce2mcgdm9fmsu7bndbjekj.apps.googleusercontent.com';

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
    });

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            const result = await promptAsync();
            if (result.type !== 'success') {
                return;
            }
            const { access_token } = result.params;
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: access_token }),
            });
            const data = await parseResponseJson(res);
            if (!res.ok) throw new Error(data.error || 'Đăng nhập Google thất bại');
            if (!data?.token || !data?.user) throw new Error('Thiếu dữ liệu đăng nhập từ server.');
            await login(data.token, data.user);
            router.replace('/(tabs)/profile');
        } catch (err: any) {
            showAlert('Lỗi', err?.message || 'Không thể đăng nhập bằng Google');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleLogin = async () => {
        if (loading) return;
        if (!email || !password) {
            showAlert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email.trim(), password }),
            });
            const data = await parseResponseJson(res);
            if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
            if (!data?.token || !data?.user) throw new Error('Thiếu dữ liệu đăng nhập từ server.');
            await login(data.token, data.user);
            router.replace('/(tabs)/profile');
        } catch (error: any) {
            showAlert('Lỗi', error?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (loading) return;
        if (!name || !email || !password) {
            showAlert('Thiếu thông tin', 'Vui lòng điền đầy đủ');
            return;
        }
        if (password !== confirmPassword) {
            showAlert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            showAlert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await parseResponseJson(res);
            if (!res.ok) throw new Error(data.message || data.error || 'Đăng ký thất bại');
            showAlert('Đăng ký thành công!', 'Vui lòng đăng nhập.', [
                { text: 'OK', onPress: () => setTab('login') }
            ]);
        } catch (error: any) {
            showAlert('Lỗi', error?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#05060a' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Background gradient blobs */}
            <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
                <LinearGradient
                    colors={['#1a0e3a', '#05060a', '#05060a']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%' }}
                />
                <View style={{
                    position: 'absolute', top: -80, right: -60,
                    width: 260, height: 260, borderRadius: 130,
                    backgroundColor: 'rgba(234,179,8,0.06)',
                }} />
                <View style={{
                    position: 'absolute', bottom: 100, left: -80,
                    width: 220, height: 220, borderRadius: 110,
                    backgroundColor: 'rgba(99,102,241,0.07)',
                }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back button */}
                        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>

                        {/* Brand */}
                        <View style={{ alignItems: 'center', marginBottom: 32 }}>
                            <View style={{ transform: [{ scaleX: 0.88 }, { scaleY: 1.18 }] }}>
                                <Text style={{ color: 'white', fontSize: 42, fontWeight: '800', letterSpacing: 0.8 }}>
                                    <Text style={{ color: '#9CA3AF' }}>KHOI</Text><Text style={{ color: '#E50914' }}>PHIM</Text>
                                </Text>
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>
                                {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                            </Text>
                        </View>

                        {/* Tab Switcher — iOS 26 pill style */}
                        <View style={{
                            flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 4, marginBottom: 24,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
                        }}>
                            {(['login', 'register'] as const).map(t => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => setTab(t)}
                                    style={{
                                        flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 12,
                                        backgroundColor: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
                                        fontWeight: tab === t ? '700' : '500', fontSize: 14
                                    }}>
                                        {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Glass Card */}
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            borderRadius: 24, padding: 20,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                        }}>
                            {/* Google button */}
                            <TouchableOpacity
                                onPress={handleGoogleLogin}
                                disabled={googleLoading || !request}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                    gap: 10, backgroundColor: 'rgba(255,255,255,0.07)',
                                    borderRadius: 14, paddingVertical: 14,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
                                    marginBottom: 18, opacity: (googleLoading || !request) ? 0.6 : 1,
                                }}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <>
                                        <View style={{ width: 22, height: 22 }}>
                                            {/* Google G logo */}
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#4285F4' }}>G</Text>
                                        </View>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                                            Tiếp tục với Google
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginHorizontal: 12 }}>hoặc</Text>
                                <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            </View>

                            {/* Name field (register only) */}
                            {tab === 'register' && (
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, marginLeft: 2 }}>Tên hiển thị</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <Ionicons name="person-outline" size={17} color="rgba(255,255,255,0.35)" />
                                        <TextInput
                                            style={{ flex: 1, color: 'white', paddingVertical: 13, paddingHorizontal: 10, fontSize: 15 }}
                                            placeholder="Tên của bạn"
                                            placeholderTextColor="rgba(255,255,255,0.25)"
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Email */}
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, marginLeft: 2 }}>Email</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <Ionicons name="mail-outline" size={17} color="rgba(255,255,255,0.35)" />
                                    <TextInput
                                        style={{ flex: 1, color: 'white', paddingVertical: 13, paddingHorizontal: 10, fontSize: 15 }}
                                        placeholder="email@example.com"
                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={{ marginBottom: tab === 'register' ? 12 : 20 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, marginLeft: 2 }}>Mật khẩu</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <Ionicons name="lock-closed-outline" size={17} color="rgba(255,255,255,0.35)" />
                                    <TextInput
                                        style={{ flex: 1, color: 'white', paddingVertical: 13, paddingHorizontal: 10, fontSize: 15 }}
                                        placeholder="Tối thiểu 6 ký tự"
                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={17} color="rgba(255,255,255,0.35)" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password (register) */}
                            {tab === 'register' && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6, marginLeft: 2 }}>Xác nhận mật khẩu</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <Ionicons name="shield-checkmark-outline" size={17} color="rgba(255,255,255,0.35)" />
                                        <TextInput
                                            style={{ flex: 1, color: 'white', paddingVertical: 13, paddingHorizontal: 10, fontSize: 15 }}
                                            placeholder="Nhập lại mật khẩu"
                                            placeholderTextColor="rgba(255,255,255,0.25)"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Submit button */}
                            <TouchableOpacity
                                onPress={tab === 'login' ? handleLogin : handleRegister}
                                disabled={loading}
                                style={{
                                    borderRadius: 14, height: 52,
                                    alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                <LinearGradient
                                    colors={['#7E95B1', '#E50914']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ position: 'absolute', inset: 0 }}
                                />
                                {loading ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>
                                        {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 }}>
                            Bằng cách tiếp tục, bạn đồng ý với{'\n'}Điều khoản sử dụng & Chính sách quyền riêng tư.
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
