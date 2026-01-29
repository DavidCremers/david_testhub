import { Platform, TextStyle } from 'react-native';

// Use SF Pro on iOS, system font on other platforms
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// iOS Dynamic Type sizes (Default)
export const fontSize = {
  caption2: 11,
  caption1: 12,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,
} as const;

// Font weights matching SF Pro
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// Typography styles matching iOS
export const typography: Record<string, TextStyle> = {
  largeTitle: {
    fontFamily,
    fontSize: fontSize.largeTitle,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.37,
    lineHeight: 41,
  },
  title1: {
    fontFamily,
    fontSize: fontSize.title1,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.36,
    lineHeight: 34,
  },
  title2: {
    fontFamily,
    fontSize: fontSize.title2,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.35,
    lineHeight: 28,
  },
  title3: {
    fontFamily,
    fontSize: fontSize.title3,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.38,
    lineHeight: 25,
  },
  headline: {
    fontFamily,
    fontSize: fontSize.headline,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  body: {
    fontFamily,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.41,
    lineHeight: 22,
  },
  callout: {
    fontFamily,
    fontSize: fontSize.callout,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.32,
    lineHeight: 21,
  },
  subheadline: {
    fontFamily,
    fontSize: fontSize.subheadline,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.24,
    lineHeight: 20,
  },
  footnote: {
    fontFamily,
    fontSize: fontSize.footnote,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.08,
    lineHeight: 18,
  },
  caption1: {
    fontFamily,
    fontSize: fontSize.caption1,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    lineHeight: 16,
  },
  caption2: {
    fontFamily,
    fontSize: fontSize.caption2,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.07,
    lineHeight: 13,
  },
} as const;

export type Typography = typeof typography;
export type FontSize = typeof fontSize;
