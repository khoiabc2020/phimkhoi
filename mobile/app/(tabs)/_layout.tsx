import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const TABS = [
  { name: 'index', label: 'Trang chủ', icon: 'tv', iconOutline: 'tv-outline' },
  { name: 'explore', label: 'Duyệt tìm', icon: 'search', iconOutline: 'search-outline' },
  { name: 'schedule', label: 'Lịch chiếu', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'profile', label: 'Tài khoản', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

function TabIcon({ focused, label, icon, iconOutline }: {
  focused: boolean;
  label: string;
  icon: string;
  iconOutline: string;
}) {
  return (
    <View style={styles.tabItem}>
      {/* Icon with active pill background */}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={(focused ? icon : iconOutline) as any}
          size={22}
          color={focused ? '#fbbf24' : 'rgba(255,255,255,0.55)'}
        />
      </View>
      {/* Label below icon */}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const isAndroid = Platform.OS === 'android';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 68,
          borderRadius: 34,
          backgroundColor: isAndroid ? 'rgba(12,12,18,0.88)' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        tabBarBackground: () =>
          !isAndroid ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 34, overflow: 'hidden' }]}
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
                iconOutline={tab.iconOutline}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 3,
    paddingVertical: 6,
    minWidth: 56,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#fbbf24',
    fontWeight: '700',
  },
});
