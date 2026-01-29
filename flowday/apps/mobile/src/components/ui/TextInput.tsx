import React, { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  StyleSheet,
} from 'react-native';
import { useColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Text } from './Text';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, leftIcon, rightIcon, style, ...props }, ref) => {
    const colors = useColors();

    return (
      <View style={styles.container}>
        {label && (
          <Text variant="subheadline" color="secondary" style={styles.label}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.secondaryGroupedBackground,
              borderColor: error ? colors.systemRed : colors.separator,
            },
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <RNTextInput
            ref={ref}
            placeholderTextColor={colors.placeholderText}
            style={[
              styles.input,
              typography.body,
              { color: colors.label },
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              style,
            ]}
            {...props}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error && (
          <Text variant="caption1" color="error" style={styles.error}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  leftIcon: {
    paddingLeft: spacing.md,
  },
  rightIcon: {
    paddingRight: spacing.md,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
