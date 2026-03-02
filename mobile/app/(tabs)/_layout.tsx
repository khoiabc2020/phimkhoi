import { Tabs } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, BLUR } from '@/constants/theme';

const TABS = [
  { name: 'index', label: 'Trang chủ', icon: 'home' },
  { name: 'explore', label: 'Duyệt tìm', icon: 'compass' },
  { name: 'download', label: 'Tải xuống', icon: 'download' },
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
      <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, { transform: [{ scale: focused ? 1.08 : 1 }] }]}>
        <Feather
          name={icon as any}
          size={20}
          color={focused ? COLORS.accent : 'rgba(255,255,255,0.65)'}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  // Floating pill tab bar (iOS 26 style) — exactly 4 items, lower + no text overflow
  const pillBottom = Math.max(insets.bottom, 6);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: {
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 6,
        },
        tabBarStyle: {
          display: Platform.isTV ? 'none' : 'flex',
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: pillBottom,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarLabel: () => null,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.03)' }]} />
          </View>
        ),
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
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
    maxWidth: 80,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    letterSpacing: 0,
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
