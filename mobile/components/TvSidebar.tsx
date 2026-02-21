import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Image } from 'expo-image';
import FocusableButton from './FocusableButton'; // Vị trí này sẽ được tạo sau

const TV_TABS = [
    { name: 'index', label: 'Trang chủ', icon: 'home', path: '/' },
    { name: 'explore', label: 'Duyệt tìm', icon: 'compass', path: '/explore' },
    { name: 'schedule', label: 'Lịch chiếu', icon: 'calendar', path: '/schedule' },
    { name: 'profile', label: 'Tài khoản', icon: 'user', path: '/profile' },
    { name: 'search', label: 'Tìm kiếm', icon: 'search', path: '/search' }
];

export default function TvSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);
    const widthAnim = useRef(new Animated.Value(80)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: isExpanded ? 220 : 80,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [isExpanded]);

    if (!Platform.isTV) return null; // Chỉ render trên TV

    return (
        <Animated.View style={[styles.container, { width: widthAnim }]}>
            <View style={styles.content}>
                {/* LOGO */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/favicon.png')}
                        style={styles.logoImage}
                        contentFit="contain"
                    />
                </View>

                {/* MENU ITEMS */}
                <View style={styles.menuContainer}>
                    {TV_TABS.map((tab, idx) => {
                        const isActive = pathname === tab.path || (pathname === '/' && tab.name === 'index');
                        return (
                            <FocusableButton
                                key={idx}
                                onPress={() => router.push(tab.path as any)}
                                onFocus={() => setIsExpanded(true)}
                                onBlur={() => setIsExpanded(false)}
                                style={[styles.menuItem, isActive && styles.menuItemActive]}
                                focusStyle={styles.menuItemFocused}
                            >
                                <Feather
                                    name={tab.icon as any}
                                    size={24}
                                    color={isActive ? COLORS.accent : 'rgba(255,255,255,0.7)'}
                                />
                                {isExpanded && (
                                    <Animated.Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                                        {tab.label}
                                    </Animated.Text>
                                )}
                            </FocusableButton>
                        );
                    })}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(12, 16, 23, 0.95)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        zIndex: 9999, // Đè lên mọi thứ để nhận Focus
        elevation: 10,
    },
    content: {
        flex: 1,
        paddingVertical: 40,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 60,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    menuContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        gap: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        width: '85%',
        backgroundColor: 'transparent',
    },
    menuItemActive: {
        backgroundColor: 'rgba(234, 179, 8, 0.1)', // Màu vàng accent nhạt
    },
    menuItemFocused: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ scale: 1.05 }],
    },
    menuLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
    menuLabelActive: {
        color: COLORS.accent,
        fontWeight: 'bold',
    }
});
