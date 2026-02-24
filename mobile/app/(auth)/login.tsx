import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            // Check content type before parsing JSON
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Server không phản hồi đúng định dạng. Vui lòng thử lại sau.');
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại');
            }

            await login(data.token, data.user);
            Alert.alert('Thành công', 'Đăng nhập thành công', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/profile') }
            ]);

        } catch (error: any) {
            if (error.message === 'Network request failed') {
                Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
            } else {
                Alert.alert('Lỗi', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <SafeAreaView className="flex-1">
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="bg-[#020617] rounded-3xl border border-white/10 px-6 py-8 shadow-2xl shadow-black/60">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mb-6 w-9 h-9 items-center justify-center rounded-full bg-white/5"
                            >
                                <Ionicons name="arrow-back" size={20} color="white" />
                            </TouchableOpacity>

                            <View className="items-center mb-8">
                                <View style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                                    <Image source={require('../../assets/images/logo.webp')} style={{ width: 72, height: 72 }} resizeMode="cover" />
                                </View>
                                <Text className="text-3xl font-bold text-white mt-4 tracking-tight">
                                    Chào mừng trở lại
                                </Text>
                                <Text className="text-gray-400 mt-2 text-center text-sm">
                                    Đăng nhập để đồng bộ tiến độ xem và phim yêu thích trên mọi thiết bị.
                                </Text>
                            </View>

                            <View className="space-y-4">
                                <View>
                                    <Text className="text-gray-400 mb-2 ml-1 text-sm">Tài khoản / Email</Text>
                                    <View className="flex-row items-center bg-gray-900 rounded-2xl px-3">
                                        <Ionicons name="person-outline" size={18} color="#9ca3af" />
                                        <TextInput
                                            className="flex-1 text-white px-2 py-3 text-base"
                                            placeholder="Nhập tài khoản hoặc email"
                                            placeholderTextColor="#6b7280"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-400 mb-2 ml-1 text-sm">Mật khẩu</Text>
                                    <View className="flex-row items-center bg-gray-900 rounded-2xl px-3">
                                        <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                                        <TextInput
                                            className="flex-1 text-white px-2 py-3 text-base"
                                            placeholder="Nhập mật khẩu"
                                            placeholderTextColor="#6b7280"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={18}
                                                color="#9ca3af"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={loading}
                                    className={`mt-5 rounded-2xl h-12 items-center justify-center bg-yellow-500 ${loading ? 'opacity-70' : ''}`}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="black" />
                                    ) : (
                                        <Text className="text-black font-bold text-base tracking-wide">Đăng nhập</Text>
                                    )}
                                </TouchableOpacity>

                                <View className="flex-row justify-center mt-6">
                                    <Text className="text-gray-400 text-sm">Chưa có tài khoản? </Text>
                                    <Link href="/(auth)/register" asChild>
                                        <TouchableOpacity>
                                            <Text className="text-yellow-500 font-semibold text-sm">Đăng ký ngay</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}
