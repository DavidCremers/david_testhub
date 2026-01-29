import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import type { Task } from '../../shared';
import { useColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Text } from '../ui/Text';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  emptyMessage?: string;
  showDeadline?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
}

export function TaskList({
  tasks,
  onTaskPress,
  onTaskComplete,
  onRefresh,
  isRefreshing = false,
  emptyMessage = 'Geen taken',
  showDeadline = true,
  ListHeaderComponent,
}: TaskListProps) {
  const colors = useColors();

  const renderItem: ListRenderItem<Task> = ({ item }) => (
    <TaskItem
      task={item}
      onPress={onTaskPress}
      onComplete={onTaskComplete}
      showDeadline={showDeadline}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text variant="body" color="secondary" style={styles.emptyText}>
        {emptyMessage}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.container,
        tasks.length === 0 && styles.emptyListContainer,
      ]}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    textAlign: 'center',
  },
});
