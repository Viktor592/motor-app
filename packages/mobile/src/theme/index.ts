// ═══════════════════════════════════════════════════
// МОТОР — Mobile Theme
// Mirrors the HTML design system for React Native
// ═══════════════════════════════════════════════════
import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  void:    '#060608',
  void2:   '#0c0c0f',
  plate:   '#111115',
  plate2:  '#16161b',
  cage:    '#1e1e25',
  wire:    '#2a2a35',
  wire2:   '#353545',
  ore:     '#ff6200',
  ore2:    '#ff8c38',
  ore3:    '#ff3d00',
  oreDim:  'rgba(255,98,0,0.12)',
  oreGlow: 'rgba(255,98,0,0.25)',
  teal:    '#00e5c4',
  tealDim: 'rgba(0,229,196,0.10)',
  gold:    '#ffc600',
  goldDim: 'rgba(255,198,0,0.10)',
  blue:    '#3db8ff',
  blueDim: 'rgba(61,184,255,0.08)',
  purple:  '#b86aff',
  green:   '#3ddc68',
  greenDim:'rgba(61,220,104,0.10)',
  red:     '#ff3b3b',
  chalk:   '#f0f0f5',
  ash:     '#c8c8d8',
  dust:    '#6a6a80',
  soot:    '#3a3a4a',
  carbon:  '#22222e',
  transparent: 'transparent',
} as const;

export const Typography = {
  // Display — Bebas Neue equivalent: use a bold condensed on native
  display: Platform.select({
    ios:     { fontFamily: 'BebasNeue-Regular' },
    android: { fontFamily: 'BebasNeue-Regular' },
  }),
  // UI — Barlow Condensed equivalent
  ui: Platform.select({
    ios:     { fontFamily: 'BarlowCondensed-SemiBold' },
    android: { fontFamily: 'BarlowCondensed-SemiBold' },
  }),
  // Body
  body: Platform.select({
    ios:     { fontFamily: 'Barlow-Regular' },
    android: { fontFamily: 'Barlow-Regular' },
  }),
  // Mono
  mono: Platform.select({
    ios:     { fontFamily: 'JetBrainsMono-Regular' },
    android: { fontFamily: 'JetBrainsMono-Regular' },
  }),
} as const;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl:48,
} as const;

export const Radius = {
  sm: 2,
  md: 4,
  lg: 8,
  full: 999,
} as const;

// ── Common reusable styles ───────────────────────
export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section separator line
  divider: {
    height: 1,
    backgroundColor: Colors.wire,
  },
  // Card surface
  card: {
    backgroundColor: Colors.plate,
    borderWidth: 1,
    borderColor: Colors.wire,
    borderRadius: Radius.sm,
  },
  // Orange accent border-left card
  accentCard: {
    backgroundColor: Colors.plate,
    borderWidth: 1,
    borderColor: Colors.wire,
    borderLeftWidth: 3,
    borderLeftColor: Colors.ore,
    borderRadius: Radius.sm,
  },
  // Badge pill
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  // Section eyebrow label
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.ore,
  },
  // Uppercase monospace label
  monoLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.dust,
  },
});
