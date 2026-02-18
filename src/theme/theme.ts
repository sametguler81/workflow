import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Color Palette ─────────────────────────────────────────
export const Colors = {
    // Primary — Corporate "Deep Royal Blue"
    primary: '#1E40AF', // Blue 800
    primaryLight: '#3B82F6', // Blue 500
    primaryDark: '#172554', // Blue 950

    // Secondary — Professional Slate
    secondary: '#475569', // Slate 600
    secondaryLight: '#94A3B8', // Slate 400
    secondaryDark: '#1E293B', // Slate 800

    // Accent — Subtle Gold/Amber (less neon)
    accent: '#B45309', // Amber 700
    accentLight: '#F59E0B', // Amber 500
    accentDark: '#78350F', // Amber 900

    // Status — Muted & Professional
    success: '#059669', // Emerald 600
    successLight: '#ECFDF5',
    warning: '#D97706', // Amber 600
    warningLight: '#FFFBEB',
    danger: '#DC2626', // Red 600
    dangerLight: '#FEF2F2',
    info: '#0369A1', // Sky 700
    infoLight: '#F0F9FF',

    // Neutrals
    white: '#FFFFFF',
    black: '#0F172A', // Slate 900 (not pure black)
    transparent: 'transparent',

    // Gradients — Corporate & Elegant
    gradientPrimary: ['#1E3A8A', '#172554'] as const, // Deep Blue to Darker Blue
    gradientSuccess: ['#059669', '#047857'] as const,
    gradientDanger: ['#B91C1C', '#991B1B'] as const,
    gradientDark: ['#0F172A', '#1E293B'] as const,
    gradientCard: ['#FFFFFF', '#F8FAFC'] as const, // Subtle light gradient for cards
    gradientOrange: ['#9A3412', '#C2410C'] as const,
    gradientSunset: ['#1E40AF', '#3730A3', '#4C1D95'] as const,
};

export const LightTheme = {
    background: '#F8FAFC', // Slate 50 (Very clean light gray)
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F5',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    statusBar: 'dark-content' as const,
    inputBackground: '#F5F7FA',
};

export const DarkTheme = {
    background: '#0F0F23',
    surface: '#1A1A2E',
    surfaceVariant: '#242444',
    card: '#1A1A2E',
    text: '#EAEAFF',
    textSecondary: '#9CA3C0',
    textTertiary: '#6B7290',
    border: '#2A2A4A',
    borderLight: '#1F1F3A',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1A1A2E',
    tabBarBorder: '#2A2A4A',
    statusBar: 'light-content' as const,
    inputBackground: '#242444',
};

export type ThemeColors = typeof LightTheme;

// ─── Typography ────────────────────────────────────────────
export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 26,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 22,
        fontWeight: '700' as const,
        letterSpacing: -0.2,
    },
    h4: {
        fontSize: 18,
        fontWeight: '600' as const,
        letterSpacing: 0,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: 0.1,
    },
    bodyBold: {
        fontSize: 16,
        fontWeight: '600' as const,
        letterSpacing: 0.1,
    },
    caption: {
        fontSize: 13,
        fontWeight: '400' as const,
        letterSpacing: 0.2,
    },
    captionBold: {
        fontSize: 13,
        fontWeight: '600' as const,
        letterSpacing: 0.2,
    },
    small: {
        fontSize: 11,
        fontWeight: '400' as const,
        letterSpacing: 0.3,
    },
    button: {
        fontSize: 16,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
};

// ─── Spacing ───────────────────────────────────────────────
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
};

// ─── Border Radius ─────────────────────────────────────────
export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
};

// ─── Shadows ───────────────────────────────────────────────
export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    }),
};

// ─── Layout ────────────────────────────────────────────────
export const Layout = {
    window: { width, height },
    isSmallDevice: width < 375,
    isTablet: width >= 768,
};
