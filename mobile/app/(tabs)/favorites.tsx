import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black items-center justify-center">
            <Text className="text-white text-xl font-bold">Danh sách yêu thích</Text>
            <Text className="text-gray-400 mt-2">Chưa có phim nào</Text>
        </SafeAreaView>
    );
}
