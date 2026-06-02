import { Platform, type TextStyle } from 'react-native';
import { Fonts } from './fonts';

type TypographyRole = Omit<TextStyle, 'color'>;

// System sans for body / dense UI — readability where the user is in a task.
const bodyFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

export const Typography: Record<string, TypographyRole> = {
  // ── Display (Pirata One) — wordmark & hero only ──
  wordmark:     { fontFamily: Fonts.display, fontSize: 64, lineHeight: 64, letterSpacing: 1 },
  displayHero:  { fontFamily: Fonts.display, fontSize: 52, lineHeight: 56, letterSpacing: 0.5 },

  // ── Engraved headings (Cinzel) ──
  displayHead:  { fontFamily: Fonts.headingBlack, fontSize: 34, lineHeight: 42, letterSpacing: 0.5 },
  sectionTitle: { fontFamily: Fonts.heading800,   fontSize: 24, lineHeight: 32, letterSpacing: 0.5 },
  headline:     { fontFamily: Fonts.heading,       fontSize: 20, lineHeight: 28, letterSpacing: 0.3 },
  subheading:   { fontFamily: Fonts.headingSemi,   fontSize: 17, lineHeight: 24, letterSpacing: 0.3 },

  // ── Engraved labels / buttons / badges (Cinzel, uppercase-friendly) ──
  label:        { fontFamily: Fonts.heading,     fontSize: 13, lineHeight: 18, letterSpacing: 1 },
  tinyLabel:    { fontFamily: Fonts.heading,     fontSize: 10, lineHeight: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
  navLabel:     { fontFamily: Fonts.heading,     fontSize: 9,  lineHeight: 12, letterSpacing: 1, textTransform: 'uppercase' },

  // ── Body (system sans) — readable, dense ──
  body:         { fontFamily: bodyFont, fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },
  bodyCompact:  { fontFamily: bodyFont, fontSize: 14, fontWeight: '400', lineHeight: 20, letterSpacing: 0 },
  caption:      { fontFamily: bodyFont, fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.2 },

  // ── Aged-ledger flavor (IM Fell English Italic) — taglines, empty states ──
  flavor:       { fontFamily: Fonts.flavorItalic, fontSize: 18, lineHeight: 26, letterSpacing: 0.2 },
  flavorSmall:  { fontFamily: Fonts.flavorItalic, fontSize: 15, lineHeight: 22, letterSpacing: 0.2 },
} as const;
