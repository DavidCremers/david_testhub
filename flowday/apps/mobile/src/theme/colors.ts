import { useColorScheme } from 'react-native';

// iOS System Colors
export const lightColors = {
  // Primary colors
  primary: '#007AFF',
  secondary: '#34C759',

  // System colors
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Grayscale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Backgrounds
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  secondaryGroupedBackground: '#FFFFFF',

  // Text
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  quaternaryLabel: 'rgba(60, 60, 67, 0.18)',
  placeholderText: 'rgba(60, 60, 67, 0.3)',

  // Separators
  separator: 'rgba(60, 60, 67, 0.29)',
  opaqueSeparator: '#C6C6C8',

  // Others
  link: '#007AFF',
  fill: 'rgba(120, 120, 128, 0.2)',
  secondaryFill: 'rgba(120, 120, 128, 0.16)',
  tertiaryFill: 'rgba(118, 118, 128, 0.12)',
  quaternaryFill: 'rgba(116, 116, 128, 0.08)',
} as const;

export const darkColors = {
  // Primary colors
  primary: '#0A84FF',
  secondary: '#30D158',

  // System colors
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',

  // Grayscale
  systemGray: '#8E8E93',
  systemGray2: '#636366',
  systemGray3: '#48484A',
  systemGray4: '#3A3A3C',
  systemGray5: '#2C2C2E',
  systemGray6: '#1C1C1E',

  // Backgrounds
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  groupedBackground: '#000000',
  secondaryGroupedBackground: '#1C1C1E',

  // Text
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  quaternaryLabel: 'rgba(235, 235, 245, 0.18)',
  placeholderText: 'rgba(235, 235, 245, 0.3)',

  // Separators
  separator: 'rgba(84, 84, 88, 0.6)',
  opaqueSeparator: '#38383A',

  // Others
  link: '#0A84FF',
  fill: 'rgba(120, 120, 128, 0.36)',
  secondaryFill: 'rgba(120, 120, 128, 0.32)',
  tertiaryFill: 'rgba(118, 118, 128, 0.24)',
  quaternaryFill: 'rgba(116, 116, 128, 0.18)',
} as const;

export type ColorScheme = typeof lightColors;

export function useColors(): ColorScheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}

// Workspace colors
export const workspaceColors = {
  work: {
    light: '#007AFF',
    dark: '#0A84FF',
  },
  private: {
    light: '#34C759',
    dark: '#30D158',
  },
} as const;

// Priority colors
export const priorityColors = {
  high: {
    light: '#FF3B30',
    dark: '#FF453A',
  },
  normal: {
    light: '#007AFF',
    dark: '#0A84FF',
  },
  low: {
    light: '#8E8E93',
    dark: '#8E8E93',
  },
} as const;
