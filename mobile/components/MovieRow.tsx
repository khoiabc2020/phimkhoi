import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '@/services/api';
import MovieCard from './MovieCard';

// Compute once at module level – avoids recalculation per card and per render
const { width: WIN_W } = Dimensions.get('window');
const isTablet = WIN_W >= 768;
const TARGET_COLS = isTablet ? Math.floor(WIN_W / 140) : 3;
const PADDING = isTablet ? 110 : 32;
const CARD_WIDTH = Math.floor((WIN_W - PADDING - (TARGET_COLS - 1) * 10) / TARGET_COLS);
const CARD_HEIGHT = Math.floor(CARD_WIDTH * 1.5);

interface MovieRowProps {
    title: string;
    movies: Movie[];
    slug?: string;
    subtitle?: string;
    type?: 'list' | 'country' | 'category';
}

const MovieRow = memo(({ title, movies, slug, subtitle, type = 'list' }: MovieRowProps) => {
    if (!movies || movies.length === 0) return null;

    const renderItem: ListRenderItem<Movie> = React.useCallback(
        ({ item }) => <MovieCard movie={item} width={CARD_WIDTH} height={CARD_HEIGHT} />,
        []
    );

    return (
        <View style={styles.container}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <View style={styles.accentBar} />
                    <View>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        )}
                    </View>
                </View>
                {slug && (
                    <Link href={`/${type}/${slug}` as any} asChild>
                        <Pressable style={styles.seeAllBtn}>
                            <Text style={styles.seeAllText}>Tất cả</Text>
                            <Ionicons name="chevron-forward" size={13} color="#8FA7C5" />
                        </Pressable>
                    </Link>
                )}
            </View>

            {/* Movie List - Optimized FlashList */}
            <FlashList
                data={movies.filter(m => m && m.slug)}
                renderItem={renderItem}
                keyExtractor={(item, index) => item._id || item.slug || `row-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                estimatedItemSize={115} // Based on MovieCard default width
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
        height: 20,
        borderRadius: 2,
        backgroundColor: '#8FA7C5',
    },
    title: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
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
        backgroundColor: 'rgba(143,167,197,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(143,167,197,0.3)',
    },
    seeAllText: {
        color: '#c7d7ea',
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
    },
});

export default React.memo(MovieRow, (prev, next) => {
    if (prev.title !== next.title) return false;
    if (prev.movies.length !== next.movies.length) return false;
    // Deep compare slugs to ensure data hasn't changed
    for (let i = 0; i < prev.movies.length; i++) {
        if (prev.movies[i].slug !== next.movies[i].slug) return false;
    }
    return true;
});
