import {
  ScrollView, View, Text, Pressable,
  RefreshControl, Platform, StyleSheet, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import HeroSection from '@/components/HeroSection';
import MovieRow from '@/components/MovieRow';
import ContinueWatchingRow from '@/components/ContinueWatchingRow';
import LoadingState from '@/components/LoadingState';
import {
  getHomeData, getMoviesByCategory, getMoviesByCountry,
  Movie, getMoviesList
} from '@/services/api';
import { CONFIG } from '@/constants/config';
import { useAuth } from '@/context/auth'; // Added imports
import { COLORS, SPACING, RADIUS, BLUR } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Main Nav Pills (Top)
const NAV_PILLS = [
  { label: 'Đề xuất', href: '/explore', active: true },
  { label: 'Phim bộ', href: '/list/phim-bo', active: false },
  { label: 'Phim lẻ', href: '/list/phim-le', active: false },
  { label: 'Hoạt hình', href: '/list/hoat-hinh', active: false },
  { label: 'TV Shows', href: '/list/tv-shows', active: false },
];

// Highlight Categories (Horizontal Scroll)
const HIGHLIGHT_CATS = [
  { label: 'Chiếu Rạp', color: '#eab308', slug: 'phim-chieu-rap' },
  { label: 'Hàn Quốc', color: '#db2777', isCountry: true, slug: 'han-quoc' },
  { label: 'Trung Quốc', color: '#ef4444', isCountry: true, slug: 'trung-quoc' },
  { label: 'Hành Động', color: '#059669', slug: 'hanh-dong' },
  { label: 'Tình Cảm', color: '#ec4899', slug: 'tinh-cam' },
  { label: 'Kinh Dị', color: '#7c3aed', slug: 'kinh-di' },
];

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user, syncHistory } = useAuth();

  // Extended Data State
  const [data, setData] = useState<{
    heroMovies: Movie[];
    phimLe: Movie[];
    phimBo: Movie[];
    hoatHinh: Movie[];
    tvShows: Movie[];
    phimChieuRap: Movie[];
    hanQuoc: Movie[];
    trungQuoc: Movie[];
    hanhDong: Movie[];
    tinhCam: Movie[];
    sapChieu: Movie[];
  }>({
    heroMovies: [], phimLe: [], phimBo: [], hoatHinh: [], tvShows: [],
    phimChieuRap: [], hanQuoc: [], trungQuoc: [], hanhDong: [], tinhCam: [], sapChieu: []
  });

  const fetchData = useCallback(async () => {
    try {
      // Parallel Fetching for speed
      const [
        homeBasic,
        heroTrendingRes,
        chieuRapRes,
        hanQuocRes,
        trungQuocRes,
        hanhDongRes,
        tinhCamRes,
        sapChieuRes
      ] = await Promise.all([
        getHomeData(),
        // TMDB trending hero from backend
        fetch(`${CONFIG.BACKEND_URL}/api/mobile/hero-trending`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        getMoviesByCategory('phim-chieu-rap', 1, 12),
        getMoviesByCountry('han-quoc', 1, 10),
        getMoviesByCountry('trung-quoc', 1, 10),
        getMoviesByCategory('hanh-dong', 1, 10),
        getMoviesByCategory('tinh-cam', 1, 10),
        getMoviesList('phim-sap-chieu', 1, 10)
      ]);

      // Hero: prefer TMDB trending, fallback to interleaved KKPHIM
      let finalHero: Movie[] = [];
      if (heroTrendingRes?.movies?.length > 0) {
        finalHero = heroTrendingRes.movies.slice(0, 12);
      } else {
        // Fallback: interleave phimBo & phimLe
        const heroMixed: Movie[] = [];
        const len = Math.max(homeBasic.phimBo.length, homeBasic.phimLe.length);
        for (let i = 0; i < len; i++) {
          if (homeBasic.phimBo[i]) heroMixed.push(homeBasic.phimBo[i]);
          if (homeBasic.phimLe[i]) heroMixed.push(homeBasic.phimLe[i]);
        }
        finalHero = heroMixed.slice(0, 8);
      }

      setData({
        heroMovies: finalHero,
        phimLe: homeBasic.phimLe,
        phimBo: homeBasic.phimBo,
        hoatHinh: homeBasic.hoatHinh,
        tvShows: homeBasic.tvShows,
        phimChieuRap: chieuRapRes.items,
        hanQuoc: hanQuocRes.items,
        trungQuoc: trungQuocRes.items,
        hanhDong: hanhDongRes.items,
        tinhCam: tinhCamRes.items,
        sapChieu: sapChieuRes.items,
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        syncHistory();
      }
    }, [user?.id])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Gradient - Dark Cinematic */}
      <LinearGradient
        colors={[COLORS.bg0, '#121826', COLORS.bg0]}
        locations={[0, 0.4, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header Background */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['rgba(11,13,18,0.95)', 'rgba(11,13,18,0.8)', 'transparent']}
          locations={[0.2, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <Ionicons name="film" size={24} color={COLORS.accent} />
              <Text style={styles.logoText}>MovieBox</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.iconBtn} onPress={() => router.push('/search' as any)}>
                <Ionicons name="search-outline" size={20} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>4</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            {NAV_PILLS.map((pill, index) => (
              <Link key={index} href={pill.href as any} asChild>
                <Pressable style={[styles.pill, index === 0 && styles.pillActive]}>
                  <Text style={[styles.pillText, index === 0 && styles.pillTextActive]}>
                    {pill.label}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} progressViewOffset={140} />
        }
      >
        {/* Hero Section - Mixed Content */}
        {loading ? (
          <View style={{ height: 400, justifyContent: 'center' }}>
            <LoadingState count={1} type="card" />
          </View>
        ) : (
          <HeroSection movies={data.heroMovies} />
        )}

        {/* Categories Compact */}
        <View style={styles.catSection}>
          <Text style={styles.sectionTitle}>Thể loại nổi bật</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {HIGHLIGHT_CATS.map((cat, idx) => (
              <Link
                key={idx}
                href={cat.isCountry ? `/country/${cat.slug}` as any : `/category/${cat.slug}` as any}
                asChild
              >
                <Pressable style={styles.catPill}>
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.catText}>{cat.label}</Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>

        {/* Tiếp tục xem (Continue Watching) */}
        {!loading && user?.history && user.history.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <ContinueWatchingRow
              title="Tiếp tục xem"
              items={user.history}
            />
          </View>
        ) : null}

        {/* Movie Rows - Synced with Web */}
        {loading ? (
          <View style={{ padding: 20 }}>
            <LoadingState count={4} type="card" />
          </View>
        ) : (
          <View style={styles.movieRows}>
            {/* Hot Sections */}
            {data.phimChieuRap.length > 0 && (
              <MovieRow title="Phim Chiếu Rạp Mới" movies={data.phimChieuRap} slug="phim-chieu-rap" />
            )}

            <MovieRow title="Phim Bộ Mới Nhất" movies={data.phimBo.slice(0, 12)} slug="phim-bo" />
            <MovieRow title="Phim Lẻ Đặc Sắc" movies={data.phimLe.slice(0, 12)} slug="phim-le" />

            {/* Countries */}
            {data.hanQuoc.length > 0 && (
              <MovieRow title="Phim Hàn Quốc Hot" movies={data.hanQuoc} slug="han-quoc" type="country" />
            )}
            {data.trungQuoc.length > 0 && (
              <MovieRow title="Phim Trung Quốc Hot" movies={data.trungQuoc} slug="trung-quoc" type="country" />
            )}

            {/* Genres */}
            {data.hanhDong.length > 0 && (
              <MovieRow title="Phim Hành Động Kịch Tính" movies={data.hanhDong} slug="hanh-dong" type="category" />
            )}
            {data.tinhCam.length > 0 && (
              <MovieRow title="Phim Tình Cảm Lãng Mạn" movies={data.tinhCam} slug="tinh-cam" type="category" />
            )}

            <MovieRow title="Hoạt Hình" movies={data.hoatHinh.slice(0, 12)} slug="hoat-hinh" />
            <MovieRow title="TV Shows" movies={data.tvShows.slice(0, 12)} slug="tv-shows" />

            {data.sapChieu.length > 0 && (
              <MovieRow title="Phim Sắp Chiếu" movies={data.sapChieu} slug="phim-sap-chieu" />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },

  // Header
  headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { paddingBottom: 10 },
  headerRow: { height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  notifBadge: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.bg0 },
  notifBadgeText: { color: 'black', fontSize: 8, fontWeight: '800' },

  // Text Pills Menu (Under Header)
  pillsRow: { paddingHorizontal: 20, gap: 16, paddingBottom: 4, paddingTop: 4 },
  pill: {
    height: 30, justifyContent: 'center',
  },
  pillActive: {
    borderBottomWidth: 0,
  },
  pillText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '600' },
  pillTextActive: { color: COLORS.accent, fontWeight: '800' },

  // Content
  scrollContent: { paddingTop: 130, paddingBottom: 100 },

  // Categories Compact
  catSection: { marginVertical: 10, paddingLeft: SPACING.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  catScroll: { gap: 8, paddingRight: 20 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', height: 36, paddingHorizontal: 12, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  catDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  catText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },

  movieRows: { gap: 10 },
});
