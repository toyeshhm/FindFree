// ─────────────────────────────────────────────────────────────────────────────
//  "The Cartographer's Cache" — Aged Sea-Chart palette
//  The whole app is a weathered treasure map. Parchment grounds, ink linework,
//  engraved brass, sealing-wax red, deep compass teal, doubloon gold.
//  Dark ink on warm parchment → high contrast, WCAG AA+ throughout.
// ─────────────────────────────────────────────────────────────────────────────
export const Colors = {
  // ── Grounds (aged chart paper, light → deep) ──
  BACKGROUND:      '#F3E4C6', // Map Beige — the chart itself
  SURFACE:         '#ECDBB9', // Parchment — raised cards
  SURFACE_HOVER:   '#E2CFAD', // pressed / hover parchment
  SURFACE_LIGHT:   '#F8EEDB', // lifted highlight (top sheen)
  SURFACE_DEEP:    '#DCC79C', // sunken well (inputs, insets)

  // ── Ink & text ──
  TEXT_PRIMARY:    '#211F18', // Warm Ink Black
  TEXT_SECONDARY:  '#3F4D36', // Seaweed — secondary copy & icons (AA on parchment)
  TEXT_MUTED:      '#6E5827', // Aged Sepia — meta, captions, placeholders (AA)

  // ── Accents ──
  ACCENT:          '#8A6E32', // Antique Brass — primary actions, selection
  ACCENT_LIGHT:    '#C99A3A', // Doubloon Gold — highlights, treasure shine
  ACCENT_DEEP:     '#5C4920', // Darker brass for deep accents
  SEALING_WAX:     '#9E2B25', // Sealing Wax Red — FREE seal, alerts, destructive
  SEA:             '#274B47', // Compass Teal — links, water, cool accent
  SEA_LIGHT:       '#3E6E66', // lighter teal

  // ── Lines & material ──
  BORDER:          'rgba(33,31,24,0.16)', // faint ink hairline
  ROPE:            '#7A6230', // twine / rope brown
  INK:             '#211F18', // alias for the darkest stroke
  BLACK:           '#211F18', // (kept) ink-black stroke used across components
  WHITE:           '#F8EEDB', // (kept) treated as paper highlight, never pure white
  TRANSPARENT:     'transparent',

  // ── Gradient stops (parchment aging / vignette) ──
  VIGNETTE:        'rgba(74,55,20,0.22)',  // burnt-edge wash
  SHEEN:           'rgba(248,238,219,0.6)', // top-light sheen
};

export type ColorToken = keyof typeof Colors;
export type ThemeColors = Record<ColorToken, string>;
