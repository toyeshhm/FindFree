export const Spacing = {
  micro:      4,
  xs:         6,
  sm:         8,
  md:         12,
  base:       16,
  lg:         24,
  xl:         32,
  xxl:        48,
  hero:       64,
  gutter:     20,
  safeTop:    28,
  safeBottom: 34,
} as const;

// Hard "stamped paper" offset shadow — the signature tactile look.
// Applied as a spread so every card/button presses into the same ink shadow.
export const Stamp = {
  sm: { shadowColor: '#211F18', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  md: { shadowColor: '#211F18', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  lg: { shadowColor: '#211F18', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 },
} as const;

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  pill: 999,
} as const;
