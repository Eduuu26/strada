import { Platform } from 'react-native';

/** Paleta inspirada en carretera nocturna: asfalto, faros, señalización. */
export const colors = {
  background: '#0c0e12',
  backgroundElevated: '#10141a',
  surface: '#151a22',
  surfaceElevated: '#1c232e',
  surfaceHover: '#222b38',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  text: '#f4f6f9',
  textSecondary: '#b8c2d0',
  textMuted: '#7a8799',
  accent: '#e8703a',
  accentMuted: '#c45a28',
  accentSoft: 'rgba(232, 112, 58, 0.14)',
  accentGlow: 'rgba(232, 112, 58, 0.28)',
  success: '#3ecf8e',
  danger: '#f07167',
  mapOverlay: 'rgba(12, 14, 18, 0.72)',
  tabBar: '#12161d',
  headerLine: 'rgba(255, 255, 255, 0.06)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const fonts = {
  family: Platform.select({
    web: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: undefined,
  }),
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const typography = {
  hero: { fontSize: 26, fontWeight: fonts.extrabold, lineHeight: 32, letterSpacing: -0.6 },
  title: { fontSize: 18, fontWeight: fonts.bold, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: fonts.regular, lineHeight: 23 },
  caption: { fontSize: 13, fontWeight: fonts.medium, lineHeight: 18 },
  kicker: { fontSize: 11, fontWeight: fonts.semibold, letterSpacing: 1.2 },
  label: { fontSize: 12, fontWeight: fonts.semibold, letterSpacing: 0.2 },
} as const;

export const shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35), 0 1px 0 rgba(255,255,255,0.04) inset',
    } as object,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  button: Platform.select({
    web: { boxShadow: '0 2px 12px rgba(232, 112, 58, 0.35)' } as object,
    default: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
  shell: Platform.select({
    web: {
      boxShadow: '0 0 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
    } as object,
    default: {},
  }),
};

export const layout = {
  contentMaxWidth: 720,
  screenPadding: spacing.md,
} as const;

export const brand = {
  name: 'Strada',
  tagline: 'Coches y motos · España',
} as const;

/** Estilo base reutilizable para tarjetas. */
export const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
};

/** Estilo base para campos de formulario. */
export const inputStyle = {
  backgroundColor: colors.backgroundElevated,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  color: colors.text,
  paddingHorizontal: spacing.md,
  minHeight: 50,
  fontSize: 16,
  ...(fonts.family ? { fontFamily: fonts.family } : {}),
};
