import { Tabs } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

const TABS = [
  { name: 'index', label: 'Trang chủ', icon: 'home' },
  { name: 'explore', label: 'Duyệt tìm', icon: 'compass' },
  { name: 'schedule', label: 'Lịch chiếu', icon: 'calendar' },
  { name: 'profile', label: 'Tài khoản', icon: 'user' },
];

function TabIcon({ focused, label, icon }: {
  focused: boolean;
  label: string;
  icon: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: focused ? 1.15 : 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <Feather
          name={icon as any}
          size={20}
          color={focused ? '#F4C84A' : 'rgba(255,255,255,0.5)'}
        />
      </Animated.View>
      {/* Label below icon */}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  // Dynamically position tab bar above system UI:
  // - Gesture nav: insets.bottom is small (~0-16px) → pill sits close to edge
  // - 3-button nav: insets.bottom is larger (~24-48px) → pill rises above buttons
  const tabBarBottom = insets.bottom > 0 ? insets.bottom + 8 : 14;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottom,
          left: 50,
          right: 50,
          height: 58,
          borderRadius: 34,
          backgroundColor: isAndroid ? 'rgba(15,18,26,0.95)' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        tabBarBackground: () =>
          !isAndroid ? (
            <BlurView
              intensity={50}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden', backgroundColor: 'rgba(15,18,26,0.75)' }]}
            />
          ) : null,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                label={tab.label}
                icon={tab.icon}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 60,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#F4C84A',
    fontWeight: '700',
  },
});
