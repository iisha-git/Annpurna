/**
 * Annpurna design tokens — single source of truth for the visual language.
 * Warm, clean, student-friendly. Nothing in the app hardcodes raw values;
 * everything imports from here.
 */

export const colors = {
  // ── Core palette (owner-approved) ──
  backgroundDark: '#0E0B13', // near-black w/ violet undertone — headers, navbar
  surface: '#FFFFFF',
  primary: '#FF9D00', // vivid amber — brand actions
  primaryLight: '#FFF0D6', // pale amber — soft fills
  textDark: '#17141A',
  textLight: '#FFFFFF',
  muted: '#8B8380',

  // Aliases used across the app (keep code readable, single source above)
  background: '#FBF7F2', // warm paper page background
  border: '#EFE3D7',
  dark: '#0E0B13',
  onDarkMuted: '#ABA3A8', // secondary text on dark surfaces
  accent: '#FF9D00',
  accentOnDark: '#FFB13D', // slightly lifted amber for dark backgrounds
  accentPressed: '#E68900',
  accentSoft: '#FFF0D6',

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

// Font families — Fredoka (rounded, chubby) for headings, Nunito for body.
// Loaded once in app/_layout.js via useFonts.
export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayRegular: 'Fredoka_400Regular',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
};

// Typography scale — families carry the weight, so no fontWeight needed
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 30 },
  h1: { fontFamily: fonts.display, fontSize: 24 },
  title: { fontFamily: fonts.bold, fontSize: 17 },
  body: { fontFamily: fonts.body, fontSize: 15 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textMuted },
};
