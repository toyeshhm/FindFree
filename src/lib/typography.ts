import type { TextStyle } from 'react-native';

type TypographyRole = Omit<TextStyle, 'color'>;

export const Typography: Record<string, TypographyRole> = {
  displayHero:  { fontSize: 56, fontWeight: '900', lineHeight: 56,  letterSpacing: 0 },
  displayHead:  { fontSize: 48, fontWeight: '900', lineHeight: 48,  letterSpacing: 0 },
  sectionTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34,  letterSpacing: -0.3 },
  headline:     { fontSize: 24, fontWeight: '700', lineHeight: 29,  letterSpacing: -0.25 },
  subheading:   { fontSize: 20, fontWeight: '500', lineHeight: 26,  letterSpacing: 0 },
  body:         { fontSize: 16, fontWeight: '400', lineHeight: 24,  letterSpacing: 0 },
  bodyCompact:  { fontSize: 15, fontWeight: '400', lineHeight: 21,  letterSpacing: 0 },
  label:        { fontSize: 14, fontWeight: '500', lineHeight: 18,  letterSpacing: 0 },
  caption:      { fontSize: 13, fontWeight: '400', lineHeight: 18,  letterSpacing: 0 },
  tinyLabel:    { fontSize: 12, fontWeight: '700', lineHeight: 14,  letterSpacing: 1.2 },
  navLabel:     { fontSize: 11, fontWeight: '700', lineHeight: 13,  letterSpacing: 0.9 },
} as const;
