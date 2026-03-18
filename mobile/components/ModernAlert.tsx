import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface ModernAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    onClose: () => void;
    type?: 'info' | 'success' | 'warning' | 'error';
}

export default function ModernAlert({
    visible,
    title,
    message,
    buttons = [{ text: 'OK', onPress: () => { } }],
    onClose,
    type = 'info'
}: ModernAlertProps) {
    const scaleValue = useRef(new Animated.Value(0.95)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    bounciness: 12,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    // Handle immediate unmount rendering issues
    if (!visible && (opacityValue as any)._value === 0) return null;

    const handlePress = (onPress?: () => void) => {
        if (onPress) onPress();
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return <Ionicons name="checkmark-circle" size={36} color="#10b981" />;
            case 'warning': return <Ionicons name="warning" size={36} color="#f59e0b" />;
            case 'error': return <Ionicons name="close-circle" size={36} color="#ef4444" />;
            default: return <Ionicons name="information-circle" size={36} color="#3b82f6" />;
        }
    };

    const getIconBackground = () => {
        switch (type) {
            case 'success': return 'rgba(16,185,129,0.15)';
            case 'warning': return 'rgba(245,158,11,0.15)';
            case 'error': return 'rgba(239,68,68,0.15)';
            default: return 'rgba(59,130,246,0.15)';
        }
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Background Dim - always show Blur */}
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: opacityValue }]} />
                </BlurView>

                {/* Animated Box without AnimatedBlurView wrapper for performance & visibility on Android */}
                <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
                    <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
                        {getIcon()}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={[styles.buttonRow, buttons.length > 2 && styles.buttonCol]}>
                        {buttons.map((btn, index) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';
                            const isPrimary = !isCancel && !isDestructive && (buttons.length === 1 || index === buttons.length - 1);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        isPrimary && styles.primaryBtn,
                                        isCancel && styles.cancelBtn,
                                        isDestructive && styles.destructiveBtn,
                                        buttons.length === 2 && { flex: 1, marginHorizontal: 6 },
                                        buttons.length > 2 && { width: '100%', marginVertical: 4 }
                                    ]}
                                    onPress={() => handlePress(btn.onPress)}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isPrimary && styles.primaryBtnText,
                                        isCancel && styles.cancelBtnText,
                                        isDestructive && styles.destructiveBtnText,
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertBox: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: 'rgba(22, 25, 32, 0.98)', // Dark near-opaque for consistent visibility on low-end
        borderRadius: 28,
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    title: {
        fontSize: 21,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    buttonCol: {
        flexDirection: 'column',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 110,
    },
    primaryBtn: {
        backgroundColor: '#eab308', // legacy accent
        shadowColor: '#eab308',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    destructiveBtn: {
        backgroundColor: 'rgba(239,68,68,0.2)', // red-500 tint
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    primaryBtnText: {
        color: '#05060a', // very dark for contrast
    },
    cancelBtnText: {
        color: '#d1d5db',
    },
    destructiveBtnText: {
        color: '#ef4444',
    },
});
