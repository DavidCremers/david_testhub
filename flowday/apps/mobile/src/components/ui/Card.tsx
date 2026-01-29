import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface CardProps extends ViewProps {
  variant?: 'default' | 'inset';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  variant = 'default',
  padding = 'medium',
  style,
  children,
  ...props
}: CardProps) {
  const colors = useColors();

  const paddingValues = {
    none: 0,
    small: spacing.sm,
    medium: spacing.md,
    large: spacing.lg,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.secondaryGroupedBackground,
          padding: paddingValues[padding],
        },
        variant === 'inset' && styles.inset,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
  },
  inset: {
    marginHorizontal: spacing.md,
  },
});
