import { Redirect, Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { useAuthStore } from '../../src/stores/auth';
import { useColors } from '../../src/theme/colors';
import { Text } from '../../src/components/ui';

// Tab bar icons using emoji for now (replace with SF Symbols in production)
function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const colors = useColors();
  const icons: Record<string, string> = {
    today: focused ? '📅' : '📆',
    tasks: focused ? '✅' : '☑️',
    agenda: focused ? '🗓️' : '📋',
    settings: focused ? '⚙️' : '⚙️',
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '📱'}
    </Text>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuthStore();

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
          ...Platform.select({
            ios: {
              // Use iOS blur effect
            },
          }),
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.label,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vandaag',
          headerLargeTitle: true,
          tabBarIcon: ({ focused }) => <TabBarIcon name="today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Taken',
          headerLargeTitle: true,
          tabBarIcon: ({ focused }) => <TabBarIcon name="tasks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          headerLargeTitle: true,
          tabBarIcon: ({ focused }) => <TabBarIcon name="agenda" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Instellingen',
          headerLargeTitle: true,
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
