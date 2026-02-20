import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Image, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { CONFIG } from '@/constants/config';

interface SearchResult {
    _id: string;
    name: string;
    slug: string;
    thumb_url: string;
    year: number;
    episode_current: string;
    lang: string;
}

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = useCallback(async (text: string) => {
        setQuery(text);
        if (text.trim().length < 2) {
            setResults([]);
            setSearched(false);
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            // Use standard API service
            const { searchMovies } = require('@/services/api');
            const items = await searchMovies(text.trim());
            setResults(items);
        } catch (e) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const renderItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => router.push(`/movie/${item.slug}` as any)}
            activeOpacity={0.75}
        >
            <Image
                source={{ uri: item.thumb_url?.startsWith('http') ? item.thumb_url : `https://img.ophim.live/uploads/movies/${item.thumb_url}` }}
                style={styles.thumb}
                resizeMode="cover"
            />
            <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.resultMeta}>
                    {item.year ? <Text style={styles.metaText}>{item.year}</Text> : null}
                    {item.episode_current ? (
                        <View style={styles.epBadge}>
                            <Text style={styles.epBadgeText}>{item.episode_current}</Text>
                        </View>
                    ) : null}
                    {item.lang ? <Text style={styles.metaText}>{item.lang}</Text> : null}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm phim, diễn viên..."
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={query}
                        onChangeText={handleSearch}
                        autoFocus
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#fbbf24" />
                </View>
            ) : searched && results.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="search-outline" size={56} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                    <Text style={styles.emptySubtitle}>Thử tìm với từ khóa khác</Text>
                </View>
            ) : !searched ? (
                <View style={styles.center}>
                    <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyTitle}>Tìm kiếm phim</Text>
                    <Text style={styles.emptySubtitle}>Nhập tên phim hoặc diễn viên</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item._id || item.slug}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: { padding: 4 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        fontWeight: '400',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginTop: 8 },
    emptySubtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    thumb: {
        width: 56,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    resultInfo: { flex: 1, gap: 6 },
    resultTitle: { color: 'white', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
    epBadge: {
        backgroundColor: 'rgba(251,191,36,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    epBadgeText: { color: '#fbbf24', fontSize: 11, fontWeight: '600' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 84 },
});
