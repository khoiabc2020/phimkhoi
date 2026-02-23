import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Bắt lỗi toàn cục để tránh crash khi bấm (lỗi trong callback không vào ErrorBoundary)
const g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));
const ErrorUtils = (g as any).ErrorUtils;
if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
  const prev = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('[Global]', isFatal ? 'FATAL' : 'ERROR', error?.message || error, error?.stack);
    if (typeof prev === 'function') prev(error, isFatal);
  });
}

// Giữ Splash hiển thị trong khi app đang nạp tài nguyên
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Ẩn Splash Screen ngay khi component mount thành công
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)/login" />
                <Stack.Screen name="(auth)/register" />
                <Stack.Screen name="movie/[slug]" />
                <Stack.Screen name="player/[slug]" />
                <Stack.Screen name="list/[type]" />
                <Stack.Screen name="category/[slug]" />
                <Stack.Screen name="country/[slug]" />
                <Stack.Screen name="search" />
                <Stack.Screen name="notifications/index" />
                <Stack.Screen name="settings/index" />
                <Stack.Screen name="history" />
                <Stack.Screen name="watchlist" />
              </Stack>
            </View>
            <StatusBar style="light" />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
