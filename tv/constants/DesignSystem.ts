/**
 * iOS 26 Design System
 * Centralized design tokens for consistent styling across the app
 */

// ============================================================================
// COLORS - iOS 26 Adaptive Color Palette
// ============================================================================

export const Colors = {
    // Primary Colors
    primary: {
        light: '#007AFF',      // iOS Blue
        dark: '#0A84FF',       // iOS Blue (Dark)
    },

    // Accent Colors
    accent: {
        yellow: '#FFD60A',     // iOS Yellow
        orange: '#FF9F0A',     // iOS Orange
        red: '#FF453A',        // iOS Red
        green: '#32D74B',      // iOS Green
        teal: '#64D2FF',       // iOS Teal
        purple: '#BF5AF2',     // iOS Purple
    },

    // Background Colors (Layered)
    background: {
        primary: {
            light: '#FFFFFF',
            dark: '#000000',
        },
        secondary: {
            light: '#F2F2F7',
            dark: '#1C1C1E',
        },
        tertiary: {
            light: '#FFFFFF',
            dark: '#2C2C2E',
        },
        elevated: {
            light: '#FFFFFF',
            dark: '#1C1C1E',
        },
    },

    // Text Colors
    text: {
        primary: {
            light: '#000000',
            dark: '#FFFFFF',
        },
        secondary: {
            light: '#3C3C43',
            dark: '#EBEBF5',
        },
        tertiary: {
            light: '#3C3C4399',   // 60% opacity
            dark: '#EBEBF599',    // 60% opacity
        },
        quaternary: {
            light: '#3C3C434D',   // 30% opacity
            dark: '#EBEBF54D',    // 30% opacity
        },
    },

    // Fill Colors (for backgrounds, buttons)
    fill: {
        primary: {
            light: '#78788033',   // 20% opacity
            dark: '#7878805C',    // 36% opacity
        },
        secondary: {
            light: '#78788028',   // 16% opacity
            dark: '#78788052',    // 32% opacity
        },
        tertiary: {
            light: '#7676801F',   // 12% opacity
            dark: '#7676803D',    // 24% opacity
        },
        quaternary: {
            light: '#74748014',   // 8% opacity
            dark: '#7474802E',    // 18% opacity
        },
    },

    // Separator Colors
    separator: {
        opaque: {
            light: '#C6C6C8',
            dark: '#38383A',
        },
        nonOpaque: {
            light: '#3C3C4349',   // 29% opacity
            dark: '#54545899',    // 60% opacity
        },
    },

    // System Colors
    system: {
        white: '#FFFFFF',
        black: '#000000',
        gray: '#8E8E93',
        gray2: '#AEAEB2',
        gray3: '#C7C7CC',
        gray4: '#D1D1D6',
        gray5: '#E5E5EA',
        gray6: '#F2F2F7',
    },
};

// ============================================================================
// TYPOGRAPHY - SF Pro Font System
// ============================================================================

export const Typography = {
    // Large Titles
    largeTitle: {
        fontSize: 34,
        lineHeight: 41,
        fontWeight: '700' as const,
        letterSpacing: 0.37,
    },

    // Titles
    title1: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '700' as const,
        letterSpacing: 0.36,
    },
    title2: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.35,
    },
    title3: {
        fontSize: 20,
        lineHeight: 25,
        fontWeight: '600' as const,
        letterSpacing: 0.38,
    },

    // Headlines
    headline: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
    },

    // Body
    body: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '400' as const,
        letterSpacing: -0.41,
    },
    bodyEmphasized: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
    },

    // Callout
    callout: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '400' as const,
        letterSpacing: -0.32,
    },
    calloutEmphasized: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '600' as const,
        letterSpacing: -0.32,
    },

    // Subheadline
    subheadline: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '400' as const,
        letterSpacing: -0.24,
    },
    subheadlineEmphasized: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600' as const,
        letterSpacing: -0.24,
    },

    // Footnote
    footnote: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '400' as const,
        letterSpacing: -0.08,
    },
    footnoteEmphasized: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600' as const,
        letterSpacing: -0.08,
    },

    // Caption
    caption1: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as const,
        letterSpacing: 0,
    },
    caption2: {
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '400' as const,
        letterSpacing: 0.07,
    },
};

// ============================================================================
// SPACING - 4px Grid System
// ============================================================================

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    massive: 48,
    giant: 64,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 9999,  // Fully rounded
};

// ============================================================================
// SHADOWS - Layered Depth System
// ============================================================================

export const Shadows = {
    // Light mode shadows
    light: {
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        lg: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        xl: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
    },

    // Dark mode shadows (more subtle)
    dark: {
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 1,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 2,
        },
        lg: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 4,
        },
        xl: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 8,
        },
    },
};

// ============================================================================
// ANIMATION - Timing Functions
// ============================================================================

export const Animation = {
    // Durations (ms)
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 400,
        slower: 600,
    },

    // Easing curves (for Animated API)
    easing: {
        // Standard iOS spring
        spring: {
            damping: 15,
            mass: 1,
            stiffness: 150,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        },

        // Gentle spring (for subtle animations)
        gentleSpring: {
            damping: 20,
            mass: 1,
            stiffness: 100,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        },

        // Bouncy spring (for playful animations)
        bouncySpring: {
            damping: 10,
            mass: 1,
            stiffness: 200,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        },
    },
};

// ============================================================================
// BLUR INTENSITY
// ============================================================================

export const BlurIntensity = {
    light: 20,
    medium: 40,
    strong: 60,
    extraStrong: 80,
    max: 100,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color based on current theme
 */
export const getColor = (colorPath: string, isDark: boolean = false) => {
    const keys = colorPath.split('.');
    let value: any = Colors;

    for (const key of keys) {
        value = value[key];
    }

    if (typeof value === 'object' && 'light' in value && 'dark' in value) {
        return isDark ? value.dark : value.light;
    }

    return value;
};

/**
 * Get shadow based on current theme
 */
export const getShadow = (size: 'sm' | 'md' | 'lg' | 'xl', isDark: boolean = false) => {
    return isDark ? Shadows.dark[size] : Shadows.light[size];
};
