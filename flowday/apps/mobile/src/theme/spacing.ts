// iOS Standard Spacing System
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// iOS Standard Margins
export const margins = {
  screen: 16,
  card: 16,
  item: 12,
  section: 20,
} as const;

// iOS Standard Radius
export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type Margins = typeof margins;
export type Radius = typeof radius;
