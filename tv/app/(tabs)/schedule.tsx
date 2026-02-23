import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScheduleScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black justify-center items-center">
            <Text className="text-white text-lg font-bold">Lịch chiếu phim</Text>
            <Text className="text-gray-400 mt-2">Tính năng đang phát triển</Text>
        </SafeAreaView>
    );
}
