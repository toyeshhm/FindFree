import { StyleSheet } from 'react-native';
import { Colors as GlobalColors, ThemeColors } from './colors';

export const LightColors = { ...GlobalColors };

export const DarkColors: ThemeColors = {
  ...LightColors,
  BACKGROUND:      '#1A1A1A',
  SURFACE:         '#2A2A2A',
  SURFACE_HOVER:   '#333333',
  SURFACE_LIGHT:   '#3A3A3A',
  SURFACE_DEEP:    '#111111',
  TEXT_PRIMARY:    '#EAEAEA',
  TEXT_SECONDARY:  '#B0B0B0',
  TEXT_MUTED:      '#808080',
  BORDER:          'rgba(255,255,255,0.1)',
  INK:             '#333333',
  WHITE:           '#1A1A1A',
  VIGNETTE:        'rgba(0,0,0,0.5)',
  SHEEN:           'rgba(255,255,255,0.05)',
};

export const OceanColors: ThemeColors = {
  ...DarkColors,
  BACKGROUND:      '#0F172A',
  SURFACE:         '#1E293B',
  SURFACE_HOVER:   '#334155',
  SURFACE_LIGHT:   '#475569',
  SURFACE_DEEP:    '#020617',
  ACCENT:          '#38BDF8',
  ACCENT_LIGHT:    '#7DD3FC',
  ACCENT_DEEP:     '#0284C7',
  INK:             '#334155',
  BORDER:          'rgba(56,189,248,0.2)',
};

export const ForestColors: ThemeColors = {
  ...DarkColors,
  BACKGROUND:      '#064E3B',
  SURFACE:         '#065F46',
  SURFACE_HOVER:   '#047857',
  SURFACE_LIGHT:   '#059669',
  SURFACE_DEEP:    '#022C22',
  ACCENT:          '#34D399',
  ACCENT_LIGHT:    '#6EE7B7',
  ACCENT_DEEP:     '#059669',
  INK:             '#047857',
  BORDER:          'rgba(52,211,153,0.2)',
};

export const SunsetColors: ThemeColors = {
  ...DarkColors,
  BACKGROUND:      '#450A0A',
  SURFACE:         '#7F1D1D',
  SURFACE_HOVER:   '#991B1B',
  SURFACE_LIGHT:   '#B91C1C',
  SURFACE_DEEP:    '#2E0606',
  ACCENT:          '#F87171',
  ACCENT_LIGHT:    '#FCA5A5',
  ACCENT_DEEP:     '#DC2626',
  INK:             '#991B1B',
  BORDER:          'rgba(248,113,113,0.2)',
};

type StyleCreator = (theme: ThemeColors) => any;

const styleCreators: { symbol: symbol; creator: StyleCreator }[] = [];
const dynamicStyles = new Map<symbol, any>();

let currentColors = LightColors;

export function createStyleSheet<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(creator: (theme: ThemeColors) => T | StyleSheet.NamedStyles<T>): T {
  const symbol = Symbol();
  styleCreators.push({ symbol, creator });
  dynamicStyles.set(symbol, StyleSheet.create(creator(currentColors) as any));
  
  return new Proxy({} as T, {
    get(target, prop) {
      return dynamicStyles.get(symbol)[prop];
    }
  });
}

export function reevaluateStyles(newColors: ThemeColors) {
  currentColors = newColors;
  // Mutate the global Colors object so inline usages (e.g. icon colors) pick up the new theme
  Object.assign(GlobalColors, newColors);
  
  for (const { symbol, creator } of styleCreators) {
    dynamicStyles.set(symbol, StyleSheet.create(creator(newColors) as any));
  }
}
