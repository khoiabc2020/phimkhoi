import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

import * as Brightness from 'expo-brightness';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const { status } = await Brightness.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('Brightness permission denied');
          }
        } catch (e) {
          console.warn('Failed to request brightness permission', e);
        }
      }
    })();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="player/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="list/[type]" options={{ headerShown: false }} />
            <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="country/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
