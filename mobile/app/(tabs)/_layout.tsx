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
          top: -6,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: '#fbbf24', // Yellow active circle
          opacity: 0.15,
          transform: [{ scale: 1.1 }]
        }} />
      )}
      <Ionicons
        size={24}
        name={focused ? name : `${name}-outline`}
        color={focused ? '#fbbf24' : '#9ca3af'} // Yellow active, Gray inactive
      />
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? '#fbbf24' : '#9ca3af',
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
        tabBarActiveTintColor: '#fbbf24',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          backgroundColor: isAndroid ? 'rgba(20, 20, 20, 0.96)' : 'transparent', // Dark background
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarBackground: () => (
          isAndroid ? null : (
            <BlurView
              intensity={80}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(10, 10, 10, 0.8)' }
              ]}
              tint="dark"
            />
          )
        ),
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

