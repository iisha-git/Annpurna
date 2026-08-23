/**
 * Annpurna design tokens — single source of truth for the visual language.
 * Warm, clean, student-friendly. Nothing in the app hardcodes raw values;
 * everything imports from here.
 */

export const colors = {
  // Surfaces
  background: '#FBF7F2', // warm paper
  surface: '#FFFFFF',
  border: '#EFE3D7',

  // Dark theme surfaces (headers, floating navbar)
  // Modern charcoal-navy — sits between black and dark navy
  dark: '#1D2430',
  onDarkMuted: '#A7B0C0', // secondary text on dark
  accentOnDark: '#FF8A50', // brighter accent for dark backgrounds

  // Text
  text: '#2B2118', // espresso
  textMuted: '#8A7A6D',

  // Brand
  accent: '#E8632B', // terracotta
  accentPressed: '#C95422',
  accentSoft: '#FDEADD',

  // Semantic
  success: '#3E9C55',
  successSoft: '#E4F3E8',
  danger: '#D9483B',
  dangerSoft: '#FBE6E3',

  // Crowd levels
  crowdLow: '#4CAF50',
  crowdModerate: '#F59E0B',
  crowdHigh: '#E0472E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

// Typography scale — system font for now, swap later if needed
const base = {
  fontFamily: undefined, // system default (SF Pro / Roboto)
};

export const typography = {
  display: { ...base, fontSize: 30, fontWeight: '800' },
  h1: { ...base, fontSize: 24, fontWeight: '700' },
  title: { ...base, fontSize: 17, fontWeight: '600' },
  body: { ...base, fontSize: 15, fontWeight: '400' },
  caption: { ...base, fontSize: 13, fontWeight: '500', color: colors.textMuted },
};
