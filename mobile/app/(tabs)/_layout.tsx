import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, BLUR, RADIUS, SPACING } from '@/constants/theme';

const TABS = [
  { name: 'index', label: 'Trang chủ', icon: 'home', iconOutline: 'home-outline' }, // Changed to 'home' for standard iOS feel, or keep 'tv' if preferred
  { name: 'explore', label: 'Duyệt tìm', icon: 'compass', iconOutline: 'compass-outline' },
  { name: 'schedule', label: 'Lịch chiếu', icon: 'calendar', iconOutline: 'calendar-outline' },
  { name: 'profile', label: 'Tài khoản', icon: 'person', iconOutline: 'person-outline' },
];

function TabIcon({ focused, label, icon, iconOutline }: {
  focused: boolean;
  label: string;
  icon: string;
  iconOutline: string;
}) {
  return (
    <View style={styles.tabItem}>
      {/* Icon with refined spacing */}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={(focused ? icon : iconOutline) as any}
          size={24} // Standard iOS tab icon size
          color={focused ? COLORS.accent : 'rgba(255,255,255,0.5)'}
        />
      </View>
      {/* Label below icon - Apple style: small and subtle */}
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
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 14, // Floating upwards
          left: 16,
          right: 16,
          height: 72, // Taller for floating look
          borderRadius: 36, // Full rounded ends
          backgroundColor: isAndroid ? 'rgba(12,12,18,0.92)' : 'transparent', // Android fallback needs high opacity
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.stroke,
        },
        tabBarBackground: () =>
          !isAndroid ? (
            <BlurView
              intensity={BLUR.tabBar} // High blur for glass effect
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 36, overflow: 'hidden' }]}
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
    gap: 4,
    width: 60,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // Removed pill background for cleaner iOS look, can add back if desired
    // width: 44,
    // height: 32,
    // borderRadius: 16,
  },
  iconWrapActive: {
    // backgroundColor: 'rgba(244, 200, 74, 0.1)', // Optional subtle pill
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
