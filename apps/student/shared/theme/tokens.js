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
