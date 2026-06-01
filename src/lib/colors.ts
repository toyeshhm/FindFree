export const Colors = {
  CHARCOAL:        '#3D3D39',
  MID_CHARCOAL:    '#4A4844',
  DEEPER_CHARCOAL: '#2D2D2A',
  LIGHT_CHARCOAL:  '#5A5450',
  CREAM:           '#F5F1E8',
  RUST:            '#8B6F47',
  RUST_LIGHT:      '#D4A574',
  MUTED_ASH:       '#B8B0A0',
  DISABLED_GRAY:   '#999999',
  DIVIDER:         'rgba(139, 111, 71, 0.3)',
} as const;

export type ColorToken = keyof typeof Colors;
