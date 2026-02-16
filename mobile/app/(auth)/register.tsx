import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '@/constants/config';

export default function RegisterScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);

        } catch (error: any) {
            Alert.alert('Lỗi', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <SafeAreaView className="flex-1 px-6">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-4 p-2 bg-gray-800 rounded-full w-10 h-10 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="items-center my-8">
                        <Ionicons name="person-add-outline" size={50} color="#fbbf24" />
                        <Text className="text-3xl font-bold text-white mt-4">Đăng Ký</Text>
                        <Text className="text-gray-400 mt-2 text-center">Tạo tài khoản để trải nghiệm tốt hơn</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-400 mb-2 ml-1">Tên hiển thị</Text>
                            <TextInput
                                className="bg-gray-800 text-white p-4 rounded-xl"
                                placeholder="Nhập tên của bạn"
                                placeholderTextColor="#6b7280"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View>
                            <Text className="text-gray-400 mb-2 ml-1">Email</Text>
                            <TextInput
                                className="bg-gray-800 text-white p-4 rounded-xl"
                                placeholder="Nhập email"
                                placeholderTextColor="#6b7280"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
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

                        <View>
                            <Text className="text-gray-400 mb-2 ml-1">Xác nhận mật khẩu</Text>
                            <TextInput
                                className="bg-gray-800 text-white p-4 rounded-xl"
                                placeholder="Nhập lại mật khẩu"
                                placeholderTextColor="#6b7280"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            className={`bg-yellow-500 p-4 rounded-xl items-center mt-6 ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text className="text-black font-bold text-lg">Đăng Ký</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-gray-400">Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text className="text-yellow-500 font-bold">Đăng nhập ngay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
