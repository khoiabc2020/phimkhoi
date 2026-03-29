import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

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
            setTimeout(() => router.replace('/(tabs)' as any), 80);
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
        <View style={{ flex: 1, backgroundColor: '#05060A' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Background gradient blobs */}
            <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
                <LinearGradient
                    colors={['#0d0a1f', '#05060A', '#05060A']}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%' }}
                />
                <View style={{
                    position: 'absolute', top: -80, right: -60,
                    width: 260, height: 260, borderRadius: 130,
                    backgroundColor: 'rgba(143,167,197,0.06)',
                }} />
                <View style={{
                    position: 'absolute', bottom: 100, left: -80,
                    width: 220, height: 220, borderRadius: 110,
                    backgroundColor: 'rgba(229,9,20,0.05)',
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
                            <Text style={{ fontSize: 38, fontWeight: '900', letterSpacing: 3 }}>
                                <Text style={{ color: '#FFFFFF' }}>KHOIPHIM</Text><Text style={{ color: '#E50914' }}>.</Text>
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>
                                {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                            </Text>
                        </View>

                        {/* Tab Switcher */}
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
                                        onSubmitEditing={tab === 'login' ? handleLogin : undefined}
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
                                    backgroundColor: '#8FA7C5',
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#05060A" />
                                ) : (
                                    <Text style={{ color: '#05060A', fontWeight: '800', fontSize: 16 }}>
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
