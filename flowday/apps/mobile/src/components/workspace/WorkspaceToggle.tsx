import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { WorkspaceType } from '@flowday/shared';
import { useWorkspaceStore } from '../../stores/workspace';
import { SegmentedControl } from '../ui/SegmentedControl';
import { workspaceColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useColorScheme } from 'react-native';

export function WorkspaceToggle() {
  const colorScheme = useColorScheme();
  const { activeWorkspaceType, setActiveWorkspace } = useWorkspaceStore();

  const options = [
    {
      value: 'private' as WorkspaceType,
      label: 'Privé',
      color: colorScheme === 'dark'
        ? workspaceColors.private.dark
        : workspaceColors.private.light,
    },
    {
      value: 'work' as WorkspaceType,
      label: 'Werk',
      color: colorScheme === 'dark'
        ? workspaceColors.work.dark
        : workspaceColors.work.light,
    },
  ];

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={options}
        selectedValue={activeWorkspaceType}
        onValueChange={setActiveWorkspace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
