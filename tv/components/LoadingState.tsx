import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Spacing, BorderRadius } from '@/constants/DesignSystem';

interface LoadingStateProps {
    count?: number;
    type?: 'card' | 'list' | 'detail';
}

/**
 * iOS 26 Style Skeleton Loading Component
 * Features: Shimmer animation, adaptive layouts
 */
export default function LoadingState({ count = 3, type = 'card' }: LoadingStateProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    if (type === 'card') {
        return (
            <View style={styles.cardContainer}>
                {Array.from({ length: count }).map((_, index) => (
                    <Animated.View key={index} style={[styles.card, { opacity }]}>
                        <View style={styles.cardPoster} />
                        <View style={styles.cardTitle} />
                        <View style={styles.cardSubtitle} />
                    </Animated.View>
                ))}
            </View>
        );
    }

    if (type === 'list') {
        return (
            <View style={styles.listContainer}>
                {Array.from({ length: count }).map((_, index) => (
                    <Animated.View key={index} style={[styles.listItem, { opacity }]}>
                        <View style={styles.listThumbnail} />
                        <View style={styles.listContent}>
                            <View style={styles.listTitle} />
                            <View style={styles.listSubtitle} />
                        </View>
                    </Animated.View>
                ))}
            </View>
        );
    }

    // Detail type
    return (
        <Animated.View style={[styles.detailContainer, { opacity }]}>
            <View style={styles.detailPoster} />
            <View style={styles.detailTitle} />
            <View style={styles.detailSubtitle} />
            <View style={styles.detailDescription} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    // Card Layout
    cardContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
    },
    card: {
        marginRight: Spacing.md,
        width: 140,
    },
    cardPoster: {
        width: 140,
        height: 210,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.md,
    },
    cardTitle: {
        width: '80%',
        height: 14,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.xs,
        marginTop: Spacing.sm,
    },
    cardSubtitle: {
        width: '60%',
        height: 12,
        backgroundColor: Colors.fill.quaternary.dark,
        borderRadius: BorderRadius.xs,
        marginTop: Spacing.xs,
    },

    // List Layout
    listContainer: {
        paddingHorizontal: Spacing.lg,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    listThumbnail: {
        width: 100,
        height: 150,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.md,
    },
    listContent: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: 'center',
    },
    listTitle: {
        width: '70%',
        height: 16,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.xs,
    },
    listSubtitle: {
        width: '50%',
        height: 14,
        backgroundColor: Colors.fill.quaternary.dark,
        borderRadius: BorderRadius.xs,
        marginTop: Spacing.sm,
    },

    // Detail Layout
    detailContainer: {
        padding: Spacing.lg,
    },
    detailPoster: {
        width: '100%',
        height: 400,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.lg,
    },
    detailTitle: {
        width: '60%',
        height: 28,
        backgroundColor: Colors.fill.tertiary.dark,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.lg,
    },
    detailSubtitle: {
        width: '40%',
        height: 16,
        backgroundColor: Colors.fill.quaternary.dark,
        borderRadius: BorderRadius.xs,
        marginTop: Spacing.sm,
    },
    detailDescription: {
        width: '100%',
        height: 60,
        backgroundColor: Colors.fill.quaternary.dark,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.md,
    },
});
