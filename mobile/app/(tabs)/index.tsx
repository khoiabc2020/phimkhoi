import {
  ScrollView, View, Text, Pressable,
  RefreshControl, Platform, StyleSheet, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import CategoryCard from '@/components/CategoryCard';
import LoadingState from '@/components/LoadingState';
import { getHomeData, Movie } from '@/services/api';
import { COLORS, SPACING, RADIUS, BLUR } from '@/constants/theme';

const { width } = Dimensions.get('window');

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

      {/* Background Gradient - Dark Premium */}
      <LinearGradient
        colors={[COLORS.bg0, '#121826', COLORS.bg0]}
        locations={[0, 0.4, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Glass Header - Optimized Height 56dp */}
      <View style={styles.headerWrapper}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerGlassBorder} />
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          {/* Top Row */}
          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="film" size={20} color={COLORS.accent} />
              </View>
              <Text style={styles.logoText}>MovieBox</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => router.push('/search' as any)}
              >
                <Ionicons name="search-outline" size={20} color={COLORS.textPrimary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>4</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
            style={{ marginTop: 4, paddingBottom: 12 }}
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
            <Pressable style={[styles.pill, styles.pillOutline]}>
              <Text style={styles.pillText}>Thể loại</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
            progressViewOffset={140}
          />
        }
      >
        {/* Hero Section */}
        {loading ? (
          <View style={{ height: height * 0.6, justifyContent: 'center' }}>
            <LoadingState count={1} type="card" />
          </View>
        ) : (
          <HeroSection movies={data.phimLe.slice(0, 8)} />
        )}

        {/* Categories Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thể loại nổi bật</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <CategoryCard title="Xuyên Không" slug="xuyen-khong" colors={['#ef4444', '#f87171']} width={140} height={70} />
            <CategoryCard title="Cổ Trang" slug="co-trang" colors={['#ea580c', '#fb923c']} width={140} height={70} />
            <CategoryCard title="Hành Động" slug="hanh-dong" colors={['#059669', '#34d399']} width={140} height={70} />
            <CategoryCard title="Tình Cảm" slug="tinh-cam" colors={['#db2777', '#f472b6']} width={140} height={70} />
          </ScrollView>
        </View>

        {/* Movie Rows */}
        {loading ? (
          <View style={{ padding: 20 }}>
            <LoadingState count={4} type="card" />
          </View>
        ) : (
          <View style={styles.movieRows}>
            <MovieRow
              title="Phim Bộ Mới Nhất"
              movies={data.phimBo.slice(0, 12)}
              slug="phim-bo"
            />
            <MovieRow
              title="Phim Lẻ Đặc Sắc"
              movies={data.phimLe.slice(0, 12)}
              slug="phim-le"
            />
            <MovieRow
              title="Hoạt Hình"
              movies={data.hoatHinh.slice(0, 12)}
              slug="hoat-hinh"
            />
            <MovieRow
              title="TV Shows"
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
    backgroundColor: COLORS.bg0,
  },

  // Header
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    // No border bottom here to let blur blend
  },
  headerGlassBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    backgroundColor: 'transparent',
    paddingBottom: 8,
  },
  headerRow: {
    height: 50, // Compact
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 200, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244, 200, 74, 0.2)',
  },
  logoText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle glass
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.bg0,
  },
  notifBadgeText: {
    color: 'black',
    fontSize: 9,
    fontWeight: '800',
  },

  // Pills
  pillsRow: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    height: 36, // Spec 36dp
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 18, // Spec 18dp
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 0, // Cleaner
  },
  pillOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  pillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Content
  scrollContent: {
    paddingTop: 120, // Adjusted for Header + Pills
    paddingBottom: 90,
  },

  // Sections
  section: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  movieRows: {
    gap: 10,
  },
});

const height = Dimensions.get('window').height;
