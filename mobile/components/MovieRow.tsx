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
    subtitle?: string;
}

const MovieRow = memo(({ title, movies, slug, subtitle }: MovieRowProps) => {
    if (!movies || movies.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    {/* Yellow accent bar */}
                    <View style={styles.accentBar} />
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        )}
                    </View>
                </View>
                {slug && (
                    <Link href={`/list/${slug}` as any} asChild>
                        <Pressable style={styles.seeAllBtn}>
                            <Text style={styles.seeAllText}>Tất cả</Text>
                            <Ionicons name="chevron-forward" size={13} color="#fbbf24" />
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
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    accentBar: {
        width: 3,
        height: 18,
        borderRadius: 2,
        backgroundColor: '#fbbf24',
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '400',
        marginTop: 1,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(251,191,36,0.1)',
    },
    seeAllText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
    },
});

export default MovieRow;
