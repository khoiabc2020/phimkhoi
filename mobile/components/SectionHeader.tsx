import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/DesignSystem';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    showSeeAll?: boolean;
    seeAllHref?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onSeeAllPress?: () => void;
}

/**
 * iOS 26 Style Section Header Component
 * Features: Title, optional subtitle, "See All" button
 */
export default function SectionHeader({
    title,
    subtitle,
    showSeeAll = false,
    seeAllHref,
    icon,
    onSeeAllPress,
}: SectionHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={24}
                        color={Colors.accent.yellow}
                        style={styles.icon}
                    />
                )}
                <View>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>

            {showSeeAll && (
                seeAllHref ? (
                    <Link href={seeAllHref} asChild>
                        <Pressable style={styles.seeAllButton}>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                            <Ionicons name="chevron-forward" size={16} color={Colors.accent.yellow} />
                        </Pressable>
                    </Link>
                ) : (
                    <Pressable style={styles.seeAllButton} onPress={onSeeAllPress}>
                        <Text style={styles.seeAllText}>Xem tất cả</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.accent.yellow} />
                    </Pressable>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: Spacing.sm,
    },
    title: {
        ...Typography.title3,
        color: Colors.text.primary.dark,
    },
    subtitle: {
        ...Typography.caption1,
        color: Colors.text.secondary.dark,
        marginTop: 2,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
    },
    seeAllText: {
        ...Typography.subheadline,
        color: Colors.accent.yellow,
        marginRight: 4,
    },
});
