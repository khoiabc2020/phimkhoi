import { View, Text } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" />
            <Slot />
        </View>
    );
}
