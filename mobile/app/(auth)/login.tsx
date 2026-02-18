import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

            <SafeAreaView className="flex-1 px-6 justify-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 z-10 p-2 bg-gray-800 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="items-center mb-10">
                    <Ionicons name="film-outline" size={64} color="#fbbf24" />
                    <Text className="text-3xl font-bold text-white mt-4">PhimKhôi</Text>
                    <Text className="text-gray-400 mt-2">Đăng nhập để đồng bộ phim yêu thích</Text>
                </View>

                <View className="space-y-4">
                    <View>
                        <Text className="text-gray-400 mb-2 ml-1">Tài khoản / Email</Text>
                        <TextInput
                            className="bg-gray-800 text-white p-4 rounded-xl"
                            placeholder="Nhập tài khoản hoặc email"
                            placeholderTextColor="#6b7280"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-400 mb-2 ml-1">Mật khẩu</Text>
                        <TextInput
                            className="bg-gray-800 text-white p-4 rounded-xl"
                            placeholder="Nhập mật khẩu"
                            placeholderTextColor="#6b7280"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        className={`bg-yellow-500 p-4 rounded-xl items-center mt-4 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text className="text-black font-bold text-lg">Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-gray-400">Chưa có tài khoản? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text className="text-yellow-500 font-bold">Đăng ký ngay</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
