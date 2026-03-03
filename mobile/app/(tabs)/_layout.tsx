import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useRef, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Animated, Easing, useWindowDimensions, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // Breakpoint for Tablet/PC
  const router = useRouter();
  const pathname = usePathname();

  // Floating pill tab bar (iOS 26 style) — exactly 4 items, lower + no text overflow
  const pillBottom = Math.max(insets.bottom, 8);

  // Nếu là Tablet/Web (>= 768px): Hiển thị SideBar bên Trái thay vì Bottom Tab Bar
  if (isTablet) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#000' }}>
        {/* L E F T   S I D E B A R */}
        <View style={[styles.sideBar, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.sideBarLogoWrap}>
            <Ionicons name="film-outline" size={28} color={COLORS.accent} />
          </View>

          <View style={styles.sideBarMenu}>
            {TABS.map((tab) => {
              const isActive = pathname === `/${tab.name}` || pathname === `/(tabs)/${tab.name}` || (pathname === '/' && tab.name === 'index');
              return (
                <Pressable
                  key={tab.name}
                  onPress={() => router.replace(`/(tabs)/${tab.name}` as any)}
                  style={[styles.sideBarItem, isActive && styles.sideBarItemActive]}
                >
                  <Feather name={tab.icon as any} size={24} color={isActive ? COLORS.accent : 'rgba(255,255,255,0.6)'} />
                  <Text style={[styles.sideBarLabel, isActive && styles.sideBarLabelActive]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.sideBarItem} onPress={() => router.push('/settings' as any)}>
            <Feather name="settings" size={24} color="rgba(255,255,255,0.6)" />
            <Text style={styles.sideBarLabel}>Cài đặt</Text>
          </Pressable>
        </View>

        {/* R I G H T   C O N T E N T */}
        <View style={{ flex: 1, overflow: 'hidden', borderRadius: 24, marginVertical: 8, marginRight: 8, backgroundColor: COLORS.bg0 }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Ẩn hoàn toàn Bottom Tab
            }}
          >
            {TABS.map((tab) => (
              <Tabs.Screen key={tab.name} name={tab.name} />
            ))}
            <Tabs.Screen name="favorites" options={{ href: null }} />
            <Tabs.Screen name="schedule" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  // Nếu là Mobile (< 768px): Hiển thị Bottom Tab Bar chuẩn
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
  // Mobile Tab Bar Styles
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

  // Tablet SideBar Styles
  sideBar: {
    width: 90,
    backgroundColor: '#000',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#1A1D24',
  },
  sideBarLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(244,200,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(244,200,74,0.2)',
  },
  sideBarMenu: {
    gap: 16,
    width: '100%',
    alignItems: 'center',
  },
  sideBarItem: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sideBarItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sideBarLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  sideBarLabelActive: {
    color: COLORS.accent,
    fontWeight: '800',
  },
});
