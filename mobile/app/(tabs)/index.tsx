import {
  ScrollView, View, Text, Pressable,
  RefreshControl, Platform, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategoryCard from '@/components/CategoryCard';
import LoadingState from '@/components/LoadingState';
import { getHomeData, Movie } from '@/services/api';

const NAV_PILLS = [
  { label: 'Đề xuất', href: '/explore', active: true },
  { label: 'Phim bộ', href: '/list/phim-bo', active: false },
  { label: 'Phim lẻ', href: '/list/phim-le', active: false },
  { label: 'Hoạt hình', href: '/list/hoat-hinh', active: false },
  { label: 'TV Shows', href: '/list/tv-shows', active: false },
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [data, setData] = useState<{
    phimLe: Movie[];
    phimBo: Movie[];
    hoatHinh: Movie[];
    tvShows: Movie[];
  }>({ phimLe: [], phimBo: [], hoatHinh: [], tvShows: [] });

  const fetchData = useCallback(async () => {
    try {
      const result = await getHomeData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* RoPhim-style Floating Transparent Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        {/* Blur background - very subtle, like RoPhim */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,15,0.85)' }]} />
        )}

        {/* Top row: Logo + Actions */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Ionicons name="film" size={26} color="#fbbf24" />
            <Text style={styles.logoText}>MovieBox</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/search' as any)}>
              <Ionicons name="search-outline" size={22} color="white" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
              <Ionicons name="notifications-outline" size={22} color="white" />
              <View style={styles.notifDot} />
            </Pressable>
          </View>
        </View>

        {/* Navigation Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          style={{ marginBottom: 8 }}
        >
          {NAV_PILLS.map((pill, index) => (
            <Link key={index} href={pill.href as any} asChild>
              <Pressable style={[styles.pill, index === 0 && styles.pillActive]}>
                <Text style={[styles.pillText, index === 0 && styles.pillTextActive]}>
                  {pill.label}
                </Text>
              </Pressable>
            </Link>
          ))}
          <Pressable style={styles.pill}>
            <Text style={styles.pillText}>Thể loại</Text>
            <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.6)" style={{ marginLeft: 2 }} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fbbf24"
            colors={['#fbbf24']}
          />
        }
      >
        {/* Hero Section */}
        {loading ? (
          <View style={styles.heroSkeleton}>
            <LoadingState count={3} type="card" />
          </View>
        ) : (
          <HeroSection movies={data.phimLe.slice(0, 8)} />
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bạn đang quan tâm gì?</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <CategoryCard title="Xuyên Không" slug="xuyen-khong" colors={['#ef4444', '#f87171']} width={150} height={80} />
            <CategoryCard title="Cổ Trang" slug="co-trang" colors={['#ea580c', '#fb923c']} width={150} height={80} />
            <CategoryCard title="Hành Động" slug="hanh-dong" colors={['#059669', '#34d399']} width={150} height={80} />
            <CategoryCard title="Tình Cảm" slug="tinh-cam" colors={['#db2777', '#f472b6']} width={150} height={80} />
            <CategoryCard title="Kinh Dị" slug="kinh-di" colors={['#7c3aed', '#a78bfa']} width={150} height={80} />
          </ScrollView>
        </View>

        {/* Movie Rows */}
        {loading ? (
          <>
            <LoadingState count={4} type="card" />
            <LoadingState count={4} type="card" />
          </>
        ) : (
          <View style={styles.movieRows}>
            <MovieRow
              title="🔥 Phim Bộ Mới Nhất"
              movies={data.phimBo.slice(0, 12)}
              slug="phim-bo"
            />
            <MovieRow
              title="🎬 Phim Lẻ Đặc Sắc"
              movies={data.phimLe.slice(0, 12)}
              slug="phim-le"
            />
            <MovieRow
              title="🎌 Hoạt Hình"
              movies={data.hoatHinh.slice(0, 12)}
              slug="hoat-hinh"
            />
            <MovieRow
              title="📺 TV Shows"
              movies={data.tvShows.slice(0, 12)}
              slug="tv-shows"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#0a0a0f',
  },

  // Pills
  pillsRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  pillText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // Content
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 100,
  },
  heroSkeleton: {
    height: 400,
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },

  movieRows: {
    marginTop: 8,
  },
});

