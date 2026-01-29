import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { Text } from './Text';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; color?: string }[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  const handlePress = async (value: T) => {
    if (value !== selectedValue) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(value);
    }
  };

  const selectedOption = options.find((o) => o.value === selectedValue);
  const accentColor = selectedOption?.color || colors.primary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.fill },
      ]}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => handlePress(option.value)}
            activeOpacity={0.8}
            style={[
              styles.option,
              isSelected && [
                styles.selectedOption,
                { backgroundColor: colors.secondaryGroupedBackground },
              ],
            ]}
          >
            <Text
              variant="subheadline"
              style={[
                styles.optionText,
                {
                  color: isSelected ? accentColor : colors.secondaryLabel,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm - 2,
  },
  selectedOption: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    textAlign: 'center',
  },
});
