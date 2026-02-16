import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

interface CategoryCardProps {
    title: string;
    slug: string;
    colors: [string, string, ...string[]];
    width?: number;
    height?: number;
}

export default function CategoryCard({ title, slug, colors, width = 160, height = 100 }: CategoryCardProps) {
    return (
        <Link href={`/category/${slug}`} asChild>
            <Pressable className="mr-3 active:opacity-90 active:scale-95 transition-all">
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width, height, borderRadius: 12, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 12 }}
                    className="shadow-md"
                >
                    <Text className="text-white font-bold text-lg leading-tight">{title}</Text>
                </LinearGradient>
            </Pressable>
        </Link>
    );
}
