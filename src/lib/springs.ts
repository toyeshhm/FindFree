// Physical, gesture-resonant springs. Nothing eases linearly; nothing floats.
export const Springs = {
  standard: { stiffness: 120, damping: 15, mass: 1 },
  heavy:    { stiffness: 100, damping: 20, mass: 1 },
  snappy:   { stiffness: 220, damping: 22, mass: 1 },
  gentle:   { stiffness: 100, damping: 18, mass: 1 },
  // A heavy "wax stamp" press — overshoots slightly then thuds to rest.
  stamp:    { stiffness: 320, damping: 18, mass: 1 },
  // A weighty doubloon flip / pin drop.
  drop:     { stiffness: 180, damping: 12, mass: 1 },
} as const;

// Timing durations (ms) for non-spring transitions. Product range: 150–260ms.
export const Durations = {
  fast:   150,
  base:   220,
  slow:   320,
  reveal: 420,
} as const;
