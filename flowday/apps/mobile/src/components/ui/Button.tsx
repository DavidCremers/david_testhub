import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const handlePress = async (event: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      textColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: colors.secondaryGroupedBackground,
      textColor: colors.primary,
    },
    destructive: {
      backgroundColor: colors.systemRed,
      textColor: '#FFFFFF',
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: colors.primary,
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 32,
    },
    medium: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      minHeight: 44,
    },
    large: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 50,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: currentVariant.backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        currentSize,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={currentVariant.textColor}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            variant={size === 'small' ? 'subheadline' : 'headline'}
            style={{ color: currentVariant.textColor }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
});
