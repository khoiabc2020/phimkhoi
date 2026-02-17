import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const LiquidTabIcon = ({ name, color, focused, label }: { name: any, color: string, focused: boolean, label: string }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1 : 0.9) }],
      opacity: withTiming(focused ? 1 : 0.7, { duration: 200 })
    };
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 50 }}>
      {focused && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(251, 191, 36, 0.15)', // Amber/Gold glow
              borderRadius: 20,
              transform: [{ scale: 1.2 }],
            }
          ]}
        />
      )}
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <Ionicons size={24} name={focused ? name : `${name}-outline`} color={color} />
        {focused && (
          <Text style={{ fontSize: 9, fontWeight: '700', color: color, marginTop: 2 }}>
            {label}
          </Text>
        )}
      </Animated.View>
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
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarShowLabel: false, // Hide default labels
        tabBarStyle: {
          position: 'absolute',
          bottom: 20, // Increased clearance
          left: 20,
          right: 20,
          height: 70, // Taller for liquid effect
          borderRadius: 35,
          backgroundColor: isAndroid ? 'rgba(20, 20, 20, 0.95)' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          paddingBottom: 0,
        },
        tabBarBackground: () => (
          isAndroid ? null : (
            <BlurView
              intensity={40}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 35, overflow: 'hidden', backgroundColor: 'rgba(10, 10, 10, 0.7)' }
              ]}
              tint="dark"
            />
          )
        ),
        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        }
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

