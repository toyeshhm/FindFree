/**
 * Font identities for "The Cartographer's Cache":
 *   - PirataOne     → display wordmark / hero moments only
 *   - Cinzel        → engraved headings, titles, labels, buttons, badges
 *   - IMFellEnglish → aged-ledger italic flavor (taglines, empty states, quotes)
 * Body / dense UI stays on the system sans for readability.
 *
 * NOTE: this file holds ONLY plain family-name strings and imports nothing —
 * so it is safe to pull into any component (and into Jest) without dragging in
 * `expo-font`. The loader hook lives in `useAppFonts.ts`.
 */
export const Fonts = {
  display:      'PirataOne_400Regular',
  heading:      'Cinzel_700Bold',
  headingBlack: 'Cinzel_900Black',
  headingSemi:  'Cinzel_600SemiBold',
  heading800:   'Cinzel_800ExtraBold',
  headingReg:   'Cinzel_400Regular',
  flavor:       'IMFellEnglish_400Regular',
  flavorItalic: 'IMFellEnglish_400Regular_Italic',
} as const;
