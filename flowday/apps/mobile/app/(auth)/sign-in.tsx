import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { useColors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Text, Button, TextInput } from '../../src/components/ui';

export default function SignInScreen() {
  const colors = useColors();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Vul je e-mailadres in');
      return;
    }
    if (!password) {
      setLocalError('Vul je wachtwoord in');
      return;
    }

    try {
      await signIn(email.trim(), password);
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
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text variant="largeTitle" style={styles.title}>
            Flowday
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Jouw taken en agenda, slim georganiseerd
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
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <Button
            title="Inloggen"
            onPress={handleSignIn}
            loading={isLoading}
            fullWidth
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text variant="subheadline" color="link">
              Wachtwoord vergeten?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="subheadline" color="secondary">
            Nog geen account?{' '}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text variant="subheadline" color="link">
                Registreren
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
