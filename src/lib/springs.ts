export const Springs = {
  standard: { stiffness: 120, damping: 15, mass: 1 },
  heavy:    { stiffness: 100, damping: 20, mass: 1 },
  snappy:   { stiffness: 200, damping: 22, mass: 1 },
  gentle:   { stiffness: 100, damping: 18, mass: 1 },
} as const;
