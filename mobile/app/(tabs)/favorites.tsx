import { View, Text, Pressable, RefreshControl, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { getFavorites, removeFavorite, FavoriteMovie } from '@/lib/favorites';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Dimensions } from 'react-native';
import { useAuth } from '@/context/auth';
import { CONFIG } from '@/constants/config';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 10;
const CARD_W = (width - 16 * 2 - GAP * (COLS - 1)) / COLS;

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token, syncFavorites } = useAuth();
  const router = useRouter();

  const load = useCallback(async () => {
    if (user && token) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setFavorites(data.favorites || []);
          syncFavorites();
        }
      } catch (e) {
        console.error('Failed to load favorites from API', e);
      }
    } else {
      const list = await getFavorites();
      setFavorites(list || []);
    }
  }, [user, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleRemove = async (movieId: string, slug: string) => {
    // Optimistic update
    setFavorites((prev) => (prev || []).filter((m) => (m.movieSlug || m.slug) !== slug));
    if (user && token) {
      try {
        await fetch(`${CONFIG.BACKEND_URL}/api/mobile/user/favorites`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ slug })
        });
        syncFavorites();
      } catch (e) {
        console.error(e);
        load(); // Revert on failure
      }
    } else {
      await removeFavorite(slug);
    }
  };

  const isEmpty = !favorites || favorites.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Yêu thích</Text>
            {!isEmpty && (
              <Text style={styles.headerSub}>{favorites.length} phim đã lưu</Text>
            )}
          </View>
          {!isEmpty && (
            <View style={styles.headerBadge}>
              <Ionicons name="heart" size={18} color="#F4C84A" />
            </View>
          )}
        </View>

        {isEmpty ? (
          /* ── Empty State ─────────────────────────── */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={36} color="rgba(244,200,74,0.6)" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có phim yêu thích</Text>
            <Text style={styles.emptySub}>
              Nhấn biểu tượng ♡ trên trang phim để thêm vào đây
            </Text>
            <Link href="/(tabs)/explore" asChild>
              <Pressable style={styles.exploreBtn}>
                <Ionicons name="compass-outline" size={16} color="black" />
                <Text style={styles.exploreBtnText}>Khám phá phim</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          /* ── Grid ────────────────────────────────── */
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <FlashList
              data={favorites}
              numColumns={COLS}
              keyExtractor={(item, idx) => item.movieId || item._id || String(idx)}
              contentContainerStyle={{ paddingBottom: 120 }}
              estimatedItemSize={CARD_W * 1.45 + 16}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4C84A" />
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const slug = item.movieSlug || item.slug || '';
                const img = item.moviePoster || item.thumb_url || item.poster_url || '';
                return (
                  <View style={{
                    flex: 1,
                    paddingLeft: index % COLS === 0 ? 0 : GAP / 2,
                    paddingRight: index % COLS === COLS - 1 ? 0 : GAP / 2,
                    marginBottom: GAP
                  }}>
                    <Pressable
                      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                      onPress={() => router.push(`/movie/${slug}` as any)}
                    >
                      <Image
                        source={{ uri: img }}
                        style={styles.cardImg}
                        contentFit="cover"
                        transition={200}
                      />
                      {/* Remove button */}
                      <Pressable
                        onPress={() => handleRemove(item.movieId || item._id || '', slug)}
                        style={styles.removeBtn}
                        hitSlop={6}
                      >
                        <Ionicons name="heart" size={14} color="#ef4444" />
                      </Pressable>
                      {/* Title */}
                      <View style={styles.cardOverlay}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {item.movieName || item.name || ''}
                        </Text>
                        {item.movieYear ? (
                          <Text style={styles.cardYear}>{item.movieYear}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  </View>
                );
              }}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090f' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  headerBadge: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(244, 200, 74, 0.1)',
    borderWidth: 1, borderColor: 'rgba(244,200,74,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(244,200,74,0.08)',
    borderWidth: 1, borderColor: 'rgba(244,200,74,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#fff', fontSize: 18, fontWeight: '700',
    textAlign: 'center', letterSpacing: -0.2,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.45)', fontSize: 13,
    textAlign: 'center', lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F4C84A',
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24, marginTop: 8,
  },
  exploreBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Grid
  grid: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    width: CARD_W,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardImg: { width: '100%', height: CARD_W * 1.45, backgroundColor: '#1e1e2e' },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 7, paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cardTitle: {
    color: '#fff', fontSize: 11, fontWeight: '600', lineHeight: 15,
  },
  cardYear: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2,
  },
});
