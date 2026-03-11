import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import Svg, { Circle, Path, Line, Polygon, Rect } from 'react-native-svg';

interface CategoryCardProps {
    title: string;
    slug: string;
    colors: [string, string, ...string[]];
    width?: number;
    height?: number;
    subtitle?: string;
    iconType?: 'film' | 'star' | 'globe' | 'mic' | 'heart' | 'sparkle';
}

function CardIcon({ type, color }: { type: string; color: string }) {
    const props = { width: 28, height: 28 };
    if (type === 'star') return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity={0.4} />
            <Polygon points="16,8 18.5,13.5 24.5,13.5 19.5,17.5 21.5,23 16,19.5 10.5,23 12.5,17.5 7.5,13.5 13.5,13.5" fill={color} opacity={0.85} />
        </Svg>
    );
    if (type === 'globe') return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity={0.4} />
            <Path d="M16 3 Q20 10 20 16 Q20 22 16 29" stroke={color} strokeWidth="1.2" fill="none" opacity={0.7} />
            <Path d="M16 3 Q12 10 12 16 Q12 22 16 29" stroke={color} strokeWidth="1.2" fill="none" opacity={0.7} />
            <Line x1="3" y1="16" x2="29" y2="16" stroke={color} strokeWidth="1.2" opacity={0.5} />
        </Svg>
    );
    if (type === 'mic') return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity={0.3} />
            <Circle cx="16" cy="13" r="4" fill={color} opacity={0.75} />
            <Path d="M10 22c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.75} />
        </Svg>
    );
    if (type === 'heart') return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity={0.3} />
            <Path d="M16 22 C16 22 8 17 8 12 C8 9.2 10.2 7 13 7 C14.6 7 16 8 16 8 C16 8 17.4 7 19 7 C21.8 7 24 9.2 24 12 C24 17 16 22 16 22Z" fill={color} opacity={0.8} />
        </Svg>
    );
    if (type === 'sparkle') return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity={0.3} />
            <Path d="M16 7 L17.5 13 L23.5 13 L18.5 17 L20 23 L16 19.5 L12 23 L13.5 17 L8.5 13 L14.5 13 Z" fill={color} opacity={0.75} />
        </Svg>
    );
    // Default: film
    return (
        <Svg {...props} viewBox="0 0 32 32" fill="none">
            <Rect x="8" y="10" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" opacity={0.6} fill="none" />
            <Path d="M8 13 L5 11 M8 16 L5 16 M8 19 L5 21 M24 13 L27 11 M24 16 L27 16 M24 19 L27 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
            <Polygon points="14,13 20,16 14,19" fill={color} opacity={0.85} />
        </Svg>
    );
}

export default function CategoryCard({ title, slug, colors, width = 160, height = 100, subtitle, iconType = 'film' }: CategoryCardProps) {
    const accentColor = colors[0];
    return (
        <Link href={`/category/${slug}`} asChild>
            <Pressable style={[styles.card, { width, height }]}>
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* Decorative shine top-right */}
                <View style={[styles.shine, { backgroundColor: accentColor }]} />

                {/* Icon top-right */}
                <View style={styles.iconWrap}>
                    <CardIcon type={iconType} color={accentColor} />
                </View>

                {/* Bottom content */}
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
    },
    shine: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        opacity: 0.1,
    },
    iconWrap: {
        position: 'absolute',
        top: 10,
        right: 10,
        opacity: 0.55,
    },
    textWrap: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    title: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
});
