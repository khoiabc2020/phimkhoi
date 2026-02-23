import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { Movie, getImageUrl } from '@/services/api';
import { COLORS } from '@/constants/theme';
import FocusableButton from '../components/FocusableButton';

const { width, height } = Dimensions.get('window');
const TV_CAROUSEL_HEIGHT = height * 0.78;

interface TvHeroCardProps {
  movie: Movie;
  isActive: boolean;
  isFav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
}

export const TvHeroCard = React.memo(function TvHeroCard({
  movie,
  isActive,
  isFav,
  onToggleFav,
  onPress,
}: TvHeroCardProps) {
  const router = useRouter();
  const categories = movie.category?.slice(0, 3) || [];

  return (
    <View style={[styles.container, !isActive && { opacity: 0.35 }]}>
      <Image
        source={{ uri: getImageUrl(movie.poster_url || movie.thumb_url) }}
        style={styles.background}
        contentFit="cover"
      />

      <View style={styles.overlayTop} />
      <View style={styles.overlaySide} />

      <View style={styles.content}>
        <Text style={styles.tagline}>Giải trí không giới hạn</Text>
        <Text style={styles.title} numberOfLines={2}>
          {movie.name}
        </Text>
        {movie.origin_name && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {movie.origin_name}
          </Text>
        )}

        <View style={styles.metaRow}>
          {movie.year && (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{movie.year}</Text>
            </View>
          )}
          {(movie.quality || movie.lang) && (
            <View style={styles.metaPillAccent}>
              <Text style={styles.metaTextAccent}>{movie.quality || 'HD'}</Text>
            </View>
          )}
          {categories.length > 0 && (
            <Text style={styles.metaDesc} numberOfLines={1}>
              {categories.map((c: any) => c.name).join(' • ')}
            </Text>
          )}
        </View>

        {movie.content && (
          <Text style={styles.description} numberOfLines={3}>
            {(movie.content as string).replace(/<\/?[^>]+(>|$)/g, '')}
          </Text>
        )}

        <View style={styles.actionsRow}>
          <FocusableButton
            style={styles.playButton}
            onPress={() => router.push(`/movie/${movie.slug}?autoPlay=true` as any)}
          >
            <View style={styles.playInner}>
              <Ionicons name="play" size={22} color="#0B0D12" />
              <Text style={styles.playText}>Phát</Text>
            </View>
          </FocusableButton>

          <FocusableButton style={styles.secondaryButton} onPress={onPress}>
            <View style={styles.secondaryInner}>
              <Ionicons name="information-circle-outline" size={22} color="#F9FAFB" />
              <Text style={styles.secondaryText}>Thông tin khác</Text>
            </View>
          </FocusableButton>

          <TouchableOpacity
            style={[styles.iconCircle, isFav && styles.iconCircleFav]}
            onPress={onToggleFav}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? COLORS.accent : 'rgba(255,255,255,0.9)'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: TV_CAROUSEL_HEIGHT,
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(11,13,18,0.85)',
  },
  overlaySide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.55,
    backgroundColor: 'rgba(11,13,18,0.82)',
  },
  content: {
    flex: 1,
    paddingLeft: 120,
    paddingRight: 80,
    justifyContent: 'center',
  },
  tagline: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(249,250,251,0.8)',
    fontSize: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.6)',
  },
  metaPillAccent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.7)',
  },
  metaText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  metaTextAccent: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  metaDesc: {
    color: 'rgba(209,213,219,0.9)',
    fontSize: 13,
  },
  description: {
    color: 'rgba(229,231,235,0.92)',
    fontSize: 15,
    maxWidth: width * 0.45,
    marginBottom: 22,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  playInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 10,
    backgroundColor: '#fbbf24',
  },
  playText: {
    color: '#0B0D12',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 6,
  },
  secondaryButton: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  secondaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(249,250,251,0.4)',
  },
  secondaryText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.7)',
  },
  iconCircleFav: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.8)',
  },
});

