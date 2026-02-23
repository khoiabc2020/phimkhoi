import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/DesignSystem';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    type?: 'default' | 'search' | 'error' | 'noData';
}

/**
 * iOS 26 Style Empty State Component
 * Features: Icon, title, description with different types
 */
export default function EmptyState({
    icon,
    title,
    description,
    type = 'default',
}: EmptyStateProps) {
    const getIconName = (): keyof typeof Ionicons.glyphMap => {
        if (icon) return icon;

        switch (type) {
            case 'search':
                return 'search-outline';
            case 'error':
                return 'alert-circle-outline';
            case 'noData':
                return 'folder-open-outline';
            default:
                return 'information-circle-outline';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'error':
                return Colors.accent.red;
            case 'search':
                return Colors.accent.teal;
            default:
                return Colors.text.tertiary.dark;
        }
    };

    return (
        <View style={styles.container}>
            <Ionicons
                name={getIconName()}
                size={64}
                color={getIconColor()}
            />
            <Text style={styles.title}>{title}</Text>
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.giant,
    },
    title: {
        ...Typography.title2,
        color: Colors.text.primary.dark,
        marginTop: Spacing.lg,
        textAlign: 'center',
    },
    description: {
        ...Typography.body,
        color: Colors.text.secondary.dark,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});
