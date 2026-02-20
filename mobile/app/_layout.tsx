import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth';

export const unstable_settings = {
    anchor: '(tabs)',
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        // Platform checks or other init logic can go here
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
                <AuthProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
                            <Stack.Screen name="player/[slug]" options={{ headerShown: false }} />
                            <Stack.Screen name="list/[type]" options={{ headerShown: false }} />
                            <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
                            <Stack.Screen name="country/[slug]" options={{ headerShown: false }} />
                            <Stack.Screen name="search" options={{ headerShown: false }} />
                            <Stack.Screen name="settings" options={{ headerShown: false }} />
                            <Stack.Screen name="watchlist" options={{ headerShown: false }} />
                            <Stack.Screen name="history" options={{ headerShown: false }} />
                            <Stack.Screen name="notifications" options={{ headerShown: false }} />
                            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                        </Stack>
                        <StatusBar style="light" />
                    </ThemeProvider>
                </AuthProvider>
            </ErrorBoundary>
        </GestureHandlerRootView>
    );
}
