import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { useColors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Text, Button, TextInput } from '../../src/components/ui';

export default function SignUpScreen() {
  const colors = useColors();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLocalError(null);
    clearError();

    if (!fullName.trim()) {
      setLocalError('Vul je naam in');
      return;
    }
    if (!email.trim()) {
      setLocalError('Vul je e-mailadres in');
      return;
    }
    if (!password) {
      setLocalError('Vul een wachtwoord in');
      return;
    }
    if (password.length < 8) {
      setLocalError('Wachtwoord moet minimaal 8 tekens bevatten');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Wachtwoorden komen niet overeen');
      return;
    }

    try {
      await signUp(email.trim(), password, fullName.trim());
      router.replace('/(tabs)');
    } catch (e) {
      // Error is handled by the store
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title1">Account aanmaken</Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Begin met het organiseren van je taken en agenda
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {displayError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.systemRed + '15' }]}>
              <Text variant="subheadline" style={{ color: colors.systemRed }}>
                {displayError}
              </Text>
            </View>
          )}

          <TextInput
            label="Naam"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Je volledige naam"
            autoCapitalize="words"
            autoComplete="name"
          />

          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="jouw@email.nl"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <TextInput
            label="Wachtwoord"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimaal 8 tekens"
            secureTextEntry
            autoComplete="new-password"
          />

          <TextInput
            label="Bevestig wachtwoord"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Herhaal je wachtwoord"
            secureTextEntry
            autoComplete="new-password"
          />

          <Button
            title="Account aanmaken"
            onPress={handleSignUp}
            loading={isLoading}
            fullWidth
          />
        </View>

        {/* Terms */}
        <Text variant="caption1" color="tertiary" style={styles.terms}>
          Door je te registreren ga je akkoord met onze Algemene Voorwaarden en Privacybeleid
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    marginBottom: spacing.lg,
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  terms: {
    textAlign: 'center',
  },
});
