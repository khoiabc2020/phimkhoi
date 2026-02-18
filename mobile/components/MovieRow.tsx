import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '@/services/api';
import MovieCard from './MovieCard';
import { FlashList } from '@shopify/flash-list';

interface MovieRowProps {
    title: string;
    movies: Movie[];
    slug?: string;
}

const MovieRow = memo(({ title, movies, slug }: MovieRowProps) => {
    if (!movies || movies.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {slug && (
                    <Link href={`/list/${slug}` as any} asChild>
                        <Pressable style={styles.seeAllBtn}>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                            <Ionicons name="chevron-forward" size={14} color="#fbbf24" />
                        </Pressable>
                    </Link>
                )}
            </View>

            {/* Movie List */}
            <FlashList
                data={movies}
                renderItem={({ item }) => <MovieCard movie={item} />}
                estimatedItemSize={130}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        color: '#fbbf24',
        fontSize: 13,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
    },
});

export default MovieRow;
