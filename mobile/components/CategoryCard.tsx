import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CategoryCardProps {
    title: string;
    slug: string;
    colors: [string, string, ...string[]];
    width?: number;
    height?: number;
    subtitle?: string;
    iconName?: any;
}

export default function CategoryCard({ title, slug, colors, width = 160, height = 100, subtitle, iconName = 'film-outline' }: CategoryCardProps) {
    const accentOpacity = 'rgba(255,255,255,0.08)';
    return (
        <Link href={`/category/${slug}`} asChild>
            <Pressable style={({ pressed }) => [styles.card, { width, height }, pressed && styles.cardPressed]}>
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Decorative circle top-right */}
                <View style={[styles.shine, { backgroundColor: colors[0] }]} />
                <View style={[styles.shineSmall, { backgroundColor: colors[0] }]} />

                {/* Icon */}
                <View style={styles.iconWrap}>
                    <Ionicons name={iconName as any} size={28} color="rgba(255,255,255,0.5)" />
                </View>

                {/* Bottom text */}
                <View style={styles.textWrap}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle} ›</Text>
                    ) : null}
                </View>
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        marginRight: 12,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        position: 'relative',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardPressed: {
        opacity: 0.88,
        transform: [{ scale: 0.97 }],
    },
    shine: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        opacity: 0.12,
    },
    shineSmall: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        opacity: 0.06,
    },
    iconWrap: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    textWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    title: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
});
