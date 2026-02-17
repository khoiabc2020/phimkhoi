import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const LiquidTabIcon = ({ name, color, focused, label }: { name: any, color: string, focused: boolean, label: string }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
      {focused && (
        <View style={{
          position: 'absolute',
          top: -5,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#fbbf24', // Yellow circle background
          opacity: 0.2
        }} />
      )}
      <Ionicons
        size={24}
        name={focused ? name : `${name}-outline`}
        color={focused ? '#ea580c' : '#6b7280'} // Orange/Dark Yellow for active, Gray for inactive
      />
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? '#ea580c' : '#6b7280',
        marginTop: 4
      }}>
        {label}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#ffffff', // White background
          borderTopWidth: 0,
          elevation: 5, // Subtle shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingTop: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <LiquidTabIcon name="home" color={color} focused={focused} label="Trang chủ" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Duyệt tìm',
          tabBarIcon: ({ color, focused }) => (
            <LiquidTabIcon name="search" color={color} focused={focused} label="Duyệt tìm" />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch chiếu',
          tabBarIcon: ({ color, focused }) => (
            <LiquidTabIcon name="calendar" color={color} focused={focused} label="Lịch chiếu" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <LiquidTabIcon name="person" color={color} focused={focused} label="Tài khoản" />
          ),
        }}
      />

      {/* Hidden Tabs */}
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}

