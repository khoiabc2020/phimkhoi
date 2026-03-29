export const COLORS = {
  // Backgrounds — synced with web (#05060a main, #0b0d18 card)
  bg0: '#05060A', // Main background
  bg1: '#0B0D18', // Card background
  bg2: '#111318', // Elevated surface

  // Accents — matching web steel-blue palette
  accent: '#E50914',           // Red accent (same as web)
  uiAccent: '#8FA7C5',         // Steel-blue for all UI active states (tabs, dots, pills)
  accentLight: '#FF2D37',      // Hover red
  accentPressed: '#8FA7C5',    // Steel-blue (web secondary)
  accentSoft: '#1E2A3A',       // Soft blue-dark surface
  accentBorder: '#2D3F55',     // Border for accent surfaces

  // Text
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.65)',
  textTertiary: 'rgba(255,255,255,0.45)',
  textMuted: 'rgba(255,255,255,0.28)',

  // Strokes/Borders
  stroke: 'rgba(255,255,255,0.08)',
  strokeLight: 'rgba(255,255,255,0.14)',

  // Glass
  glassOverlay: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassCard: 'rgba(255,255,255,0.04)',
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 100,
};

export const SPACING = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

// Blur intensities for expo-blur — liquid glass nổi bật
export const BLUR = {
  header: 40,
  tabBar: 50,
  glassCard: 35,
};
