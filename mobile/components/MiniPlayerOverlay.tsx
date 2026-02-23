import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMiniPlayer } from '@/context/miniplayer';

const { width, height } = Dimensions.get('window');

export default function MiniPlayerOverlay() {
  const { mini, closeMini } = useMiniPlayer();
  const [expanded, setExpanded] = useState(false);

  const size = useMemo(() => {
    if (expanded) {
      const w = Math.min(width - 24, 520);
      return { w, h: Math.round(w * 9 / 16) };
    }
    const w = Math.min(180, Math.max(150, Math.round(width * 0.42)));
    return { w, h: Math.round(w * 9 / 16) };
  }, [expanded]);

  const pos = useRef({ x: 12, y: Math.max(80, height - size.h - 120) }).current;
  const [xy, setXy] = useState({ x: pos.x, y: pos.y });

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !expanded,
    onMoveShouldSetPanResponder: (_, g) => !expanded && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
    onPanResponderMove: (_, g) => {
      const nx = Math.max(8, Math.min(width - size.w - 8, pos.x + g.dx));
      const ny = Math.max(60, Math.min(height - size.h - 80, pos.y + g.dy));
      setXy({ x: nx, y: ny });
    },
    onPanResponderRelease: () => {
      pos.x = xy.x;
      pos.y = xy.y;
    },
  }), [expanded, height, pos, size.h, size.w, width, xy.x, xy.y]);

  if (!mini?.url) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { width: size.w, height: size.h, transform: [{ translateX: xy.x }, { translateY: xy.y }] }
      ]}
      {...(!expanded ? panResponder.panHandlers : {})}
    >
      <View style={styles.card}>
        <Video
          style={StyleSheet.absoluteFill}
          source={{ uri: mini.url }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          useNativeControls={false}
        />

        <View style={styles.topBar} pointerEvents="box-none">
          <View style={{ flex: 1, paddingRight: 8 }}>
            {!!mini.title && <Text style={styles.title} numberOfLines={1}>{mini.title}</Text>}
            {!!mini.episode && <Text style={styles.sub} numberOfLines={1}>{mini.episode}</Text>}
          </View>

          <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
            <Ionicons name={expanded ? 'contract-outline' : 'expand-outline'} size={18} color="white" />
          </Pressable>
          <Pressable onPress={closeMini} style={styles.iconBtn}>
            <Ionicons name="close" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  title: { color: 'white', fontSize: 12, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

