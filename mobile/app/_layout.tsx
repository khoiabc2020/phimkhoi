import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import TvSidebar from '@/components/TvSidebar';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Platform-specific initialization if needed
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <TvSidebar />
              <View style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
                  <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
                  <Stack.Screen name="player/[slug]" options={{ headerShown: false }} />
                  <Stack.Screen name="list/[type]" options={{ headerShown: false }} />
                  <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
                  <Stack.Screen name="country/[slug]" options={{ headerShown: false }} />
                </Stack>
              </View>
            </View>
            <StatusBar style="light" />
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
