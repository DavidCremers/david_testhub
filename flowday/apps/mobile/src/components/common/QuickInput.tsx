import React, { useState, useRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Text } from '../ui/Text';

interface QuickInputProps {
  placeholder?: string;
  onSubmit: (text: string) => Promise<void>;
  isProcessing?: boolean;
}

export function QuickInput({
  placeholder = 'Nieuwe taak of afspraak...',
  onSubmit,
  isProcessing = false,
}: QuickInputProps) {
  const colors = useColors();
  const inputRef = useRef<RNTextInput>(null);
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isProcessing) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onSubmit(text.trim());
      setText('');
      Keyboard.dismiss();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleMicPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement speech recognition
    console.log('Speech recognition not yet implemented');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.secondaryGroupedBackground,
            borderColor: isFocused ? colors.primary : colors.separator,
          },
        ]}
      >
        {/* Input field */}
        <RNTextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            typography.body,
            { color: colors.label },
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
          editable={!isProcessing}
        />

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Microphone button */}
          <TouchableOpacity
            onPress={handleMicPress}
            style={styles.iconButton}
            disabled={isProcessing}
          >
            <Text
              style={[
                styles.icon,
                { color: isProcessing ? colors.tertiaryLabel : colors.secondaryLabel },
              ]}
            >
              🎤
            </Text>
          </TouchableOpacity>

          {/* Submit button */}
          {text.trim() && (
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
              ]}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitIcon}>↑</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick tips */}
      {isFocused && !text && (
        <View style={styles.tips}>
          <Text variant="caption1" color="secondary">
            Tip: Gebruik @werk of @privé, #label, !hoog voor prioriteit
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 48,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  submitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  submitIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tips: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
