import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 15, // Reduced from 25
          left: 15, // Reduced from 20
          right: 15, // Reduced from 20
          height: 60, // Reduced from 65
          borderRadius: 30,
          backgroundColor: 'transparent', // Handled by BlurView
          borderTopWidth: 0,
          elevation: 0, // Android shadow handled differently if needed
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 0, // Reset default padding
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 35, overflow: 'hidden', backgroundColor: 'rgba(20, 20, 20, 0.85)' }]}>
            {Platform.OS === 'ios' && (
              <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
            )}
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginBottom: 8,
        },
        tabBarItemStyle: {
          height: 65,
          justifyContent: 'center',
          alignItems: 'center',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
              <Ionicons size={22} name={focused ? "home" : "home-outline"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Duyệt tìm',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
              <Ionicons size={22} name={focused ? "search" : "search-outline"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch chiếu',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
              <Ionicons size={22} name={focused ? "calendar" : "calendar-outline"} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 2 }}>
              <Ionicons size={22} name={focused ? "person" : "person-outline"} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden Tabs */}
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}

