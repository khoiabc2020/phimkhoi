import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Pressable, ScrollView, Modal
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchMovies, searchActors, getImageUrl, getMoviesByCategory, getMoviesByCountry } from '@/services/api';
import { CONFIG } from '@/constants/config';

const HISTORY_KEY = 'search_history_v2';
const MAX_HISTORY = 5;

const CATEGORIES = [
    { label: 'Hành Động', slug: 'hanh-dong' }, { label: 'Tình Cảm', slug: 'tinh-cam' },
    { label: 'Kinh Dị', slug: 'kinh-di' }, { label: 'Hài Hước', slug: 'hai-huoc' },
    { label: 'Hoạt Hình', slug: 'hoat-hinh' }, { label: 'Viễn Tưởng', slug: 'vien-tuong' },
    { label: 'Tâm Lý', slug: 'tam-ly' }, { label: 'Cổ Trang', slug: 'co-trang' },
    { label: 'Chiến Tranh', slug: 'chien-tranh' }, { label: 'Bí Ẩn', slug: 'bi-an' },
    { label: 'Học Đường', slug: 'hoc-duong' }, { label: 'Gia Đình', slug: 'gia-dinh' },
    { label: 'Lịch Sử', slug: 'lich-su' }, { label: 'Thể Thao', slug: 'the-thao' },
    { label: 'Tài Liệu', slug: 'tai-lieu' }, { label: 'Hình Sự', slug: 'hinh-su' },
];

const COUNTRIES = [
    { label: 'Hàn Quốc', slug: 'han-quoc' }, { label: 'Trung Quốc', slug: 'trung-quoc' },
    { label: 'Âu Mỹ', slug: 'au-my' }, { label: 'Nhật Bản', slug: 'nhat-ban' },
    { label: 'Thái Lan', slug: 'thai-lan' }, { label: 'Việt Nam', slug: 'viet-nam' },
    { label: 'Đài Loan', slug: 'dai-loan' }, { label: 'Ấn Độ', slug: 'an-do' },
    { label: 'Philippines', slug: 'philippines' }, { label: 'Hong Kong', slug: 'hong-kong' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: String(y), slug: String(y) };
});

const POPULAR_QUERIES = ['Phim hành động 2024', 'Phim Hàn Quốc', 'Phim kinh dị', 'Phim hoạt hình', 'Phim tình cảm', 'Phim viễn tưởng'];
const ACCENT = '#E50914';
const ACCENT_SOFT = 'rgba(143,167,197,0.16)';
const ACCENT_BORDER = 'rgba(143,167,197,0.36)';
const SEARCH_CACHE_TTL = 2 * 60 * 1000;

interface SearchResult {
    _id: string; name: string; slug: string; thumb_url: string;
    year: number; episode_current: string; lang: string;
}

type SearchMode = 'movie' | 'actor';
type FilterType = 'category' | 'country' | 'year' | null;

export default function SearchScreen() {
    const router = useRouter();
    const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState(initialQuery || '');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [actorResults, setActorResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [mode, setMode] = useState<SearchMode>('movie');
    const [history, setHistory] = useState<string[]>([]);
    const [popularMovies, setPopularMovies] = useState<SearchResult[]>([]);
    const [popularLoading, setPopularLoading] = useState(true);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestSeqRef = useRef(0);
    const searchCacheRef = useRef(new Map<string, { ts: number; movies: SearchResult[]; actors: any[] }>());

    // Filter state
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState<FilterType>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    // Auto-search if pre-filled query from URL param
    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load history
    useEffect(() => {
        AsyncStorage.getItem(HISTORY_KEY).then(val => {
            if (val) setHistory(JSON.parse(val));
        });
        // Load popular movies
        setPopularLoading(true);
        fetch(`${CONFIG.BACKEND_URL}/api/trending`).then(r => r.ok ? r.json() : null).then(data => {
            if (data?.movies?.length) setPopularMovies(data.movies.slice(0, 12));
            else {
                getMoviesByCategory('hanh-dong', 1, 12).then(r => {
                    if (r?.items?.length) setPopularMovies(r.items.slice(0, 12));
                }).catch(() => { });
            }
        }).catch(() => {
            getMoviesByCategory('hanh-dong', 1, 12).then(r => {
                if (r?.items?.length) setPopularMovies(r.items.slice(0, 12));
            }).catch(() => { });
        }).finally(() => setPopularLoading(false));
    }, []);

    const saveHistory = async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const next = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, MAX_HISTORY);
        setHistory(next);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    };

    const clearHistory = async () => {
        setHistory([]);
        await AsyncStorage.removeItem(HISTORY_KEY);
    };

    const doSearch = useCallback(async (text: string, sMode: SearchMode = mode) => {
        const trimmed = text.trim();
        if (trimmed.length < 2) {
            setResults([]); setActorResults([]); setSearched(false);
            return;
        }
        setSearched(true);
        const cacheKey = `${sMode}:${trimmed.toLowerCase()}`;
        const cacheHit = searchCacheRef.current.get(cacheKey);
        if (cacheHit && Date.now() - cacheHit.ts < SEARCH_CACHE_TTL) {
            setResults(cacheHit.movies);
            setActorResults(cacheHit.actors);
            setLoading(false);
            return;
        }

        const reqId = ++requestSeqRef.current;
        setLoading(true);
        try {
            if (sMode === 'actor') {
                const actors = await searchActors(trimmed);
                if (reqId !== requestSeqRef.current) return;
                setActorResults(actors); setResults([]);
                searchCacheRef.current.set(cacheKey, { ts: Date.now(), movies: [], actors });
            } else {
                const [items, actors] = await Promise.all([
                    searchMovies(trimmed, 12),
                    searchActors(trimmed)
                ]);
                if (reqId !== requestSeqRef.current) return;
                setResults(items); setActorResults(actors);
                searchCacheRef.current.set(cacheKey, { ts: Date.now(), movies: items, actors });
            }
        } catch {
            if (reqId !== requestSeqRef.current) return;
            setResults([]);
            setActorResults([]);
        } finally {
            if (reqId === requestSeqRef.current) setLoading(false);
        }
    }, [mode]);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const trimmed = text.trim();
        if (trimmed.length < 2) {
            requestSeqRef.current += 1;
            setLoading(false);
            setResults([]);
            setActorResults([]);
            setSearched(false);
            return;
        }

        setLoading(true); // instant lightweight feedback when query changes
        setSearched(true);
        debounceTimerRef.current = setTimeout(() => {
            doSearch(trimmed, mode);
        }, 280);
    };

    const handleSubmit = () => {
        if (query.trim().length >= 2) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            doSearch(query, mode);
            saveHistory(query.trim());
        }
    };

    const handleHistoryTap = (q: string) => {
        setQuery(q);
        doSearch(q, mode);
    };

    const handlePopularTap = (q: string) => {
        setQuery(q);
        doSearch(q, mode);
        saveHistory(q);
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    const handleFilterApply = async () => {
        setFilterOpen(false);
        if (!selectedCategory && !selectedCountry && !selectedYear) return;
        setLoading(true); setSearched(true);
        try {
            let items: any[] = [];
            if (selectedCountry) {
                const r = await getMoviesByCountry(selectedCountry, 1, 24);
                items = r?.items || [];
            } else if (selectedCategory) {
                const r = await getMoviesByCategory(selectedCategory, 1, 24);
                items = r?.items || [];
            } else if (selectedYear) {
                const res = await fetch(`https://phimapi.com/v1/api/danh-sach/phim-bo?limit=24&year=${selectedYear}`).then(r => r.json());
                items = res?.data?.items || [];
            }
            setResults(items);
        } catch { setResults([]); } finally { setLoading(false); }
    };

    const hasActiveFilter = selectedCategory || selectedCountry || selectedYear;

    const renderItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity style={styles.resultItem} onPress={() => router.push(`/movie/${item.slug}` as any)} activeOpacity={0.75}>
            <Image source={{ uri: getImageUrl(item.thumb_url) }} style={styles.thumb} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.resultMeta}>
                    {item.year ? <Text style={styles.metaText}>{item.year}</Text> : null}
                    {item.episode_current ? (
                        <View style={styles.epBadge}><Text style={styles.epBadgeText}>{item.episode_current}</Text></View>
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
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Tìm phim, diễn viên..."
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={query}
                        onChangeText={handleSearch}
                        onSubmitEditing={handleSubmit}
                        autoFocus
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                            requestSeqRef.current += 1;
                            setQuery('');
                            setLoading(false);
                            setResults([]);
                            setActorResults([]);
                            setSearched(false);
                        }}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>
                {/* Filter button */}
                <TouchableOpacity
                    style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
                    onPress={() => setFilterOpen(true)}
                >
                    <Ionicons name="options-outline" size={20} color={hasActiveFilter ? ACCENT : 'white'} />
                </TouchableOpacity>
            </View>

            {/* Mode Toggle: Phim vs Diễn Viên */}
            <View style={styles.modeRow}>
                <Pressable
                    onPress={() => { setMode('movie'); if (query.trim().length >= 2) doSearch(query, 'movie'); }}
                    style={[styles.modeBtn, mode === 'movie' && styles.modeBtnActive]}
                >
                    <Ionicons name="film-outline" size={14} color={mode === 'movie' ? '#0B0D12' : 'rgba(255,255,255,0.5)'} style={{ marginRight: 6 }} />
                    <Text style={[styles.modeBtnText, mode === 'movie' && styles.modeBtnTextActive]}>Phim</Text>
                </Pressable>
                <Pressable
                    onPress={() => { setMode('actor'); if (query.trim().length >= 2) doSearch(query, 'actor'); }}
                    style={[styles.modeBtn, mode === 'actor' && styles.modeBtnActive]}
                >
                    <Ionicons name="people-outline" size={14} color={mode === 'actor' ? '#0B0D12' : 'rgba(255,255,255,0.5)'} style={{ marginRight: 6 }} />
                    <Text style={[styles.modeBtnText, mode === 'actor' && styles.modeBtnTextActive]}>Diễn viên</Text>
                </Pressable>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={ACCENT} /></View>
            ) : searched && results.length === 0 && actorResults.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="search-outline" size={56} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
                    <Text style={styles.emptySubtitle}>Thử tìm với từ khóa khác</Text>
                </View>
            ) : !searched ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Search History */}
                    {history.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
                                <TouchableOpacity onPress={clearHistory}>
                                    <Text style={styles.sectionAction}>Xóa tất cả</Text>
                                </TouchableOpacity>
                            </View>
                            {history.map((q, i) => (
                                <TouchableOpacity key={i} style={styles.historyItem} onPress={() => handleHistoryTap(q)}>
                                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.35)" />
                                    <Text style={styles.historyText}>{q}</Text>
                                    <Ionicons name="arrow-forward-outline" size={14} color="rgba(255,255,255,0.2)" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Popular Queries */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Gợi ý tìm kiếm</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                            {POPULAR_QUERIES.map((q, i) => (
                                <TouchableOpacity key={i} style={styles.tagPill} onPress={() => handlePopularTap(q)}>
                                    <Text style={styles.tagText}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Popular Movies */}
                    {popularLoading ? (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <ActivityIndicator size="small" color={ACCENT} />
                        </View>
                    ) : popularMovies.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Đề xuất phổ biến</Text>
                            <View style={styles.gridContainer}>
                                {popularMovies.map((m: any, i) => (
                                    <TouchableOpacity key={m._id || i} style={styles.gridItem} onPress={() => router.push(`/movie/${m.slug}` as any)}>
                                        <Image source={{ uri: getImageUrl(m.thumb_url || m.poster_url) }} style={styles.gridThumb} contentFit="cover" cachePolicy="memory-disk" />
                                        <Text style={styles.gridTitle} numberOfLines={1}>{m.name}</Text>
                                        {m.year ? <Text style={styles.gridMeta}>{m.year}</Text> : null}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            ) : (
                <FlatList
                    data={mode === 'actor' ? [] : results}
                    keyExtractor={(item) => item._id || item.slug}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListHeaderComponent={actorResults.length > 0 ? (
                        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 4 }}>
                            <Text style={{ color: '#c7d7ea', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
                                Diễn viên / Đạo diễn
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                                {actorResults.map((actor) => {
                                    const profileImg = actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null;
                                    return (
                                        <TouchableOpacity key={actor.id} onPress={() => router.push(`/dien-vien/${encodeURIComponent(actor.name)}` as any)} style={{ alignItems: 'center', width: 68 }}>
                                            <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(143,167,197,0.45)', backgroundColor: '#1e293b', marginBottom: 6 }}>
                                                {profileImg ? (
                                                    <Image source={{ uri: profileImg }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                                ) : (
                                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Ionicons name="person" size={24} color="#475569" />
                                                    </View>
                                                )}
                                            </View>
                                            <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{actor.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : null}
                    ListFooterComponent={mode === 'actor' && actorResults.length === 0 ? (
                        <View style={styles.center}>
                            <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.15)" />
                            <Text style={styles.emptyTitle}>Không tìm thấy diễn viên</Text>
                        </View>
                    ) : null}
                />
            )}

            {/* Filter Modal */}
            <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
                    <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>
                            <TouchableOpacity onPress={() => { setSelectedCategory(null); setSelectedCountry(null); setSelectedYear(null); }}>
                                <Text style={styles.clearFilter}>Xóa bộ lọc</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Filter Type Tabs */}
                            <View style={styles.filterTabs}>
                                {(['category', 'country', 'year'] as FilterType[]).map(ft => (
                                    <Pressable key={ft} style={[styles.filterTab, filterType === ft && styles.filterTabActive]} onPress={() => setFilterType(ft === filterType ? null : ft)}>
                                        <Text style={[styles.filterTabText, filterType === ft && styles.filterTabTextActive]}>
                                            {ft === 'category' ? 'Thể loại' : ft === 'country' ? 'Quốc gia' : 'Năm'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Category list */}
                            {filterType === 'category' && (
                                <View style={styles.filterOptions}>
                                    {CATEGORIES.map(c => (
                                        <Pressable key={c.slug} style={[styles.filterOption, selectedCategory === c.slug && styles.filterOptionActive]} onPress={() => setSelectedCategory(selectedCategory === c.slug ? null : c.slug)}>
                                            <Text style={[styles.filterOptionText, selectedCategory === c.slug && styles.filterOptionTextActive]}>{c.label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Country list */}
                            {filterType === 'country' && (
                                <View style={styles.filterOptions}>
                                    {COUNTRIES.map(c => (
                                        <Pressable key={c.slug} style={[styles.filterOption, selectedCountry === c.slug && styles.filterOptionActive]} onPress={() => setSelectedCountry(selectedCountry === c.slug ? null : c.slug)}>
                                            <Text style={[styles.filterOptionText, selectedCountry === c.slug && styles.filterOptionTextActive]}>{c.label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Year list */}
                            {filterType === 'year' && (
                                <View style={styles.filterOptions}>
                                    {YEARS.map(y => (
                                        <Pressable key={y.slug} style={[styles.filterOption, selectedYear === y.slug && styles.filterOptionActive]} onPress={() => setSelectedYear(selectedYear === y.slug ? null : y.slug)}>
                                            <Text style={[styles.filterOptionText, selectedYear === y.slug && styles.filterOptionTextActive]}>{y.label}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <Pressable style={styles.applyBtn} onPress={handleFilterApply}>
                            <Text style={styles.applyBtnText}>Áp dụng{hasActiveFilter ? ' bộ lọc' : ''}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0f' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
        gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backBtn: { padding: 4 },
    filterBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterBtnActive: { backgroundColor: ACCENT_SOFT, borderColor: ACCENT },
    searchBar: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    input: { flex: 1, color: 'white', fontSize: 15, fontWeight: '400' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginTop: 8 },
    emptySubtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },

    // Mode Toggle
    modeRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
    modeBtn: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    modeBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT_BORDER },
    modeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
    modeBtnTextActive: { color: '#0B0D12' },

    // Sections
    section: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
    sectionAction: { color: '#c7d7ea', fontSize: 12, fontWeight: '600' },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
    historyText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    tagPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tagText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

    // Popular grid
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    gridItem: { width: '30%' },
    gridThumb: { width: '100%', aspectRatio: 2 / 3, borderRadius: 8, backgroundColor: '#1a1a2e' },
    gridTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginTop: 4 },
    gridMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 },

    // Search Result
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    thumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
    resultInfo: { flex: 1, gap: 6 },
    resultTitle: { color: 'white', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
    epBadge: { backgroundColor: ACCENT_SOFT, borderWidth: 1, borderColor: ACCENT_BORDER, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    epBadgeText: { color: '#c7d7ea', fontSize: 11, fontWeight: '600' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 84 },

    // Filter Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#12151f', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: '85%' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    modalTitle: { color: 'white', fontSize: 17, fontWeight: '700' },
    clearFilter: { color: '#c7d7ea', fontSize: 13, fontWeight: '600' },
    filterTabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    filterTab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    filterTabActive: { backgroundColor: ACCENT_SOFT, borderColor: ACCENT },
    filterTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
    filterTabTextActive: { color: '#c7d7ea' },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    filterOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterOptionActive: { backgroundColor: ACCENT_SOFT, borderColor: ACCENT },
    filterOptionText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
    filterOptionTextActive: { color: '#c7d7ea', fontWeight: '600' },
    applyBtn: { marginHorizontal: 20, marginTop: 12, paddingVertical: 14, borderRadius: 14, backgroundColor: '#263243', borderWidth: 1, borderColor: ACCENT_BORDER, alignItems: 'center' },
    applyBtnText: { color: '#d8e3f2', fontSize: 16, fontWeight: '700' },
});
