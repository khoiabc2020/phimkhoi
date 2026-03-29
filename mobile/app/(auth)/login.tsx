import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';
import { apiFetch } from '@/lib/apiFetch';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const parseResponseJson = async (res: Response) => {
        const raw = await res.text();
        try { return JSON.parse(raw); } catch { throw new Error('Lỗi kết nối server, vui lòng thử lại.'); }
    };

    const handleLogin = async () => {
        if (loading) return;
        if (!email.trim() || !password) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
            return;
        }
        setLoading(true);
        try {
            const res = await apiFetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email.trim(), password }),
            });
            const data = await parseResponseJson(res);
            if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');
            if (!data?.token || !data?.user) throw new Error('Dữ liệu đăng nhập không hợp lệ');
            await login(data.token, data.user);
            setTimeout(() => router.replace('/(tabs)' as any), 80);
        } catch (error: any) {
            Alert.alert('Đăng nhập thất bại', error?.message || 'Không thể kết nối server');
        } finally { setLoading(false); }
    };

    const handleRegister = async () => {
        if (loading) return;
        if (!name.trim() || !email.trim() || !password) {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
            return;
        }
        setLoading(true);
        try {
            const res = await apiFetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await parseResponseJson(res);
            if (!res.ok) throw new Error(data.message || data.error || 'Đăng ký thất bại');
            Alert.alert('🎉 Đăng ký thành công!', 'Tài khoản đã được tạo. Vui lòng đăng nhập.', [
                { text: 'Đăng nhập ngay', onPress: () => setTab('login') }
            ]);
        } catch (error: any) {
            Alert.alert('Đăng ký thất bại', error?.message || 'Vui lòng thử lại');
        } finally { setLoading(false); }
    };

    const InputField = ({
        icon, placeholder, value, onChangeText, secureTextEntry,
        keyboardType, autoCapitalize, toggleSecure, onSubmitEditing
    }: any) => (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.07)',
            borderRadius: 16, paddingHorizontal: 16,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
            marginBottom: 12,
        }}>
            <Ionicons name={icon} size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
            <TextInput
                style={{ flex: 1, color: 'white', paddingVertical: 14, fontSize: 15 }}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.28)"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize || 'none'}
                returnKeyType="done"
                onSubmitEditing={onSubmitEditing}
            />
            {toggleSecure && (
                <TouchableOpacity onPress={toggleSecure} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#05060A' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Ambient glow blobs */}
            <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
                <View style={{ position: 'absolute', top: -120, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(143,167,197,0.07)' }} />
                <View style={{ position: 'absolute', bottom: 60, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(229,9,20,0.05)' }} />
                <LinearGradient colors={['rgba(143,167,197,0.06)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <SafeAreaView style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back */}
                        <TouchableOpacity onPress={() => router.back()} style={{
                            marginBottom: 32, width: 40, height: 40, borderRadius: 20,
                            backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                        }}>
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>

                        {/* Brand */}
                        <View style={{ alignItems: 'center', marginBottom: 36 }}>
                            <Text style={{ fontSize: 42, fontWeight: '900', letterSpacing: 4, marginBottom: 8 }}>
                                <Text style={{ color: '#FFFFFF' }}>KHOIPHIM</Text>
                                <Text style={{ color: '#E50914' }}>.</Text>
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, letterSpacing: 0.3 }}>
                                {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                            </Text>
                        </View>

                        {/* Tab Switcher */}
                        <View style={{
                            flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 18, padding: 4, marginBottom: 24,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                        }}>
                            {(['login', 'register'] as const).map(t => (
                                <TouchableOpacity
                                    key={t} onPress={() => setTab(t)}
                                    style={{
                                        flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14,
                                        backgroundColor: tab === t ? 'rgba(143,167,197,0.18)' : 'transparent',
                                        borderWidth: tab === t ? 1 : 0,
                                        borderColor: tab === t ? 'rgba(143,167,197,0.3)' : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        color: tab === t ? '#c7d7ea' : 'rgba(255,255,255,0.38)',
                                        fontWeight: tab === t ? '700' : '500', fontSize: 14,
                                    }}>
                                        {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Form Card */}
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: 24, padding: 20,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                        }}>
                            {tab === 'register' && (
                                <InputField icon="person-outline" placeholder="Tên hiển thị" value={name}
                                    onChangeText={setName} autoCapitalize="words" />
                            )}
                            <InputField icon="mail-outline" placeholder="Email" value={email}
                                onChangeText={setEmail} keyboardType="email-address" />
                            <InputField icon="lock-closed-outline" placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={password}
                                onChangeText={setPassword} secureTextEntry={!showPassword}
                                toggleSecure={() => setShowPassword(!showPassword)}
                                onSubmitEditing={tab === 'login' ? handleLogin : undefined}
                            />
                            {tab === 'register' && (
                                <InputField icon="shield-checkmark-outline" placeholder="Xác nhận mật khẩu" value={confirmPassword}
                                    onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword}
                                    toggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            )}

                            {/* Submit */}
                            <TouchableOpacity
                                onPress={tab === 'login' ? handleLogin : handleRegister}
                                disabled={loading}
                                style={{
                                    height: 52, borderRadius: 16, marginTop: 4,
                                    backgroundColor: '#8FA7C5',
                                    alignItems: 'center', justifyContent: 'center',
                                    opacity: loading ? 0.7 : 1,
                                    shadowColor: '#8FA7C5', shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#05060A" />
                                ) : (
                                    <Text style={{ color: '#05060A', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 }}>
                                        {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 17 }}>
                            Tiếp tục đồng nghĩa bạn đồng ý với{'\n'}Điều khoản sử dụng & Chính sách quyền riêng tư
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
