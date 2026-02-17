import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 60 + insets.bottom; // Dynamic height

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(10, 10, 10, 0.95)', // Glass effect dark background
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_HEIGHT,
          paddingTop: 8,
          // Platform specific adjustment if needed, but insets.bottom handles most
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          paddingBottom: insets.bottom > 0 ? 0 : 5 // Add padding if no safe area (old button nav)
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Duyệt tìm',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "search" : "search-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch chiếu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "calendar" : "calendar-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />

      {/* Hidden Tabs */}
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}
