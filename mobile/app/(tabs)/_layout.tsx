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
          size={22}
          color={focused ? COLORS.accent : 'rgba(255,255,255,0.6)'}
        />
      </Animated.View>
      {/* Label below icon */}
      <Text style={[styles.tabLabel, focused && { color: COLORS.accent, fontWeight: '700' }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  // Edge-to-edge flat bottom bar with Liquid Glass
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
          display: Platform.isTV ? 'none' : 'flex',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom, // push icons up safely
          backgroundColor: isAndroid ? 'rgba(15,18,26,0.92)' : 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(255,255,255,0.15)',
          elevation: 0,
        },
        tabBarBackground: () =>
          !isAndroid ? (
            <BlurView
              intensity={80} // Heavy liquid glass
              tint="dark"
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,12,18,0.4)' }]}
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
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
