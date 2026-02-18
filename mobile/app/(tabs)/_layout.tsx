import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Refined icon set - tinh tế, đầy đủ
const TABS = [
  {
    name: 'index',
    label: 'Trang chủ',
    icon: 'tv',              // filled - TV/streaming feel
    iconOutline: 'tv-outline',
  },
  {
    name: 'explore',
    label: 'Khám phá',
    icon: 'compass',         // filled - discovery
    iconOutline: 'compass-outline',
  },
  {
    name: 'schedule',
    label: 'Lịch chiếu',
    icon: 'film',            // filled - cinema schedule
    iconOutline: 'film-outline',
  },
  {
    name: 'profile',
    label: 'Tài khoản',
    icon: 'person-circle',   // filled - profile
    iconOutline: 'person-circle-outline',
  },
];

function TabIcon({ focused, label, icon, iconOutline }: {
  focused: boolean;
  label: string;
  icon: string;
  iconOutline: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons
        name={(focused ? icon : iconOutline) as any}
        size={20}
        color={focused ? '#fbbf24' : 'rgba(255,255,255,0.5)'}
      />
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
      >
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
        // KEY FIX: override default padding that pushes icons up
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 62,
          borderRadius: 31,
          backgroundColor: isAndroid ? 'rgba(18,18,24,0.97)' : 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.1)',
        },
        tabBarBackground: () =>
          !isAndroid ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 31, overflow: 'hidden' },
              ]}
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
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    minWidth: 40,
  },
  tabItemActive: {
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: '#fbbf24',
    fontWeight: '700',
  },
});
