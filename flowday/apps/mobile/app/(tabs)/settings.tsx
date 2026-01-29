import { View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuthStore } from '../../src/stores/auth';
import { useWorkspaceStore } from '../../src/stores/workspace';
import { useColors, workspaceColors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { Text, Card } from '../../src/components/ui';
import { useColorScheme } from 'react-native';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingsRow({ title, subtitle, onPress, rightElement, destructive }: SettingsRowProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.settingsRow,
        { borderBottomColor: colors.separator },
      ]}
    >
      <View style={styles.settingsRowContent}>
        <Text
          variant="body"
          style={destructive ? { color: colors.systemRed } : undefined}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption1" color="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && (
        <Text variant="body" color="tertiary">
          ›
        </Text>
      ))}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuthStore();
  const { workspaces } = useWorkspaceStore();

  const handleSignOut = () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const workWorkspace = workspaces.find((w) => w.type === 'work');
  const privateWorkspace = workspaces.find((w) => w.type === 'private');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={styles.content}
    >
      {/* Account Section */}
      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.sectionHeader}>
          ACCOUNT
        </Text>
        <Card padding="none">
          <SettingsRow
            title={user?.fullName || user?.email || 'Gebruiker'}
            subtitle={user?.email}
          />
        </Card>
      </View>

      {/* Workspaces Section */}
      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.sectionHeader}>
          WERKRUIMTES
        </Text>
        <Card padding="none">
          <SettingsRow
            title="Privé"
            rightElement={
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? workspaceColors.private.dark
                        : workspaceColors.private.light,
                  },
                ]}
              />
            }
            onPress={() => {
              // TODO: Navigate to workspace settings
            }}
          />
          <SettingsRow
            title="Werk"
            rightElement={
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? workspaceColors.work.dark
                        : workspaceColors.work.light,
                  },
                ]}
              />
            }
            onPress={() => {
              // TODO: Navigate to workspace settings
            }}
          />
        </Card>
      </View>

      {/* Integrations Section */}
      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.sectionHeader}>
          INTEGRATIES
        </Text>
        <Card padding="none">
          <SettingsRow
            title="Google Agenda"
            subtitle="Niet verbonden"
            onPress={() => {
              // TODO: Implement Google Calendar integration
              Alert.alert('Binnenkort beschikbaar', 'Google Agenda integratie komt binnenkort!');
            }}
          />
        </Card>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.sectionHeader}>
          VOORKEUREN
        </Text>
        <Card padding="none">
          <SettingsRow
            title="Meldingen"
            rightElement={
              <Switch
                value={true}
                onValueChange={() => {
                  // TODO: Implement notification settings
                }}
                trackColor={{ true: colors.primary }}
              />
            }
          />
          <SettingsRow
            title="Taal"
            subtitle="Nederlands"
            onPress={() => {
              // TODO: Implement language settings
            }}
          />
        </Card>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text variant="footnote" color="secondary" style={styles.sectionHeader}>
          OVER
        </Text>
        <Card padding="none">
          <SettingsRow title="Versie" subtitle="1.0.0" />
          <SettingsRow
            title="Privacybeleid"
            onPress={() => {
              // TODO: Open privacy policy
            }}
          />
          <SettingsRow
            title="Algemene Voorwaarden"
            onPress={() => {
              // TODO: Open terms of service
            }}
          />
        </Card>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <Card padding="none">
          <SettingsRow
            title="Uitloggen"
            destructive
            onPress={handleSignOut}
          />
        </Card>
      </View>

      {/* Footer */}
      <Text variant="caption1" color="tertiary" style={styles.footer}>
        Gemaakt met ❤️ voor productiviteit
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsRowContent: {
    flex: 1,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
