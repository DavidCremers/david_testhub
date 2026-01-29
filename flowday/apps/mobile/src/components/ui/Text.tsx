import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type TextVariant = keyof typeof typography;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'link' | 'error';
}

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}: TextProps) {
  const colors = useColors();

  const colorMap = {
    primary: colors.label,
    secondary: colors.secondaryLabel,
    tertiary: colors.tertiaryLabel,
    link: colors.link,
    error: colors.systemRed,
  };

  return (
    <RNText
      style={[
        typography[variant],
        { color: colorMap[color] },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
