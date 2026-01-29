import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { useColors } from '../../src/theme/colors';

export default function AuthLayout() {
  const colors = useColors();
  const { isAuthenticated } = useAuthStore();

  // Redirect to main app if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: 'Inloggen',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: 'Registreren',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
