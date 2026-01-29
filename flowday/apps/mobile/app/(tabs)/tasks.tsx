import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useWorkspaceStore } from '../../src/stores/workspace';
import { useTasksStore } from '../../src/stores/tasks';
import { useColors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Text, SegmentedControl } from '../../src/components/ui';
import { TaskList } from '../../src/components/tasks';
import { WorkspaceToggle } from '../../src/components/workspace/WorkspaceToggle';
import { QuickInput } from '../../src/components/common/QuickInput';
import type { Task, TaskStatus } from '@flowday/shared';

type FilterType = 'all' | 'open' | 'completed';

export default function TasksScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<FilterType>('open');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { tasks, loadTasks, completeTask, reopenTask, createTask } = useTasksStore();

  const loadData = useCallback(async () => {
    if (!activeWorkspace) return;
    await loadTasks(activeWorkspace.id);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleQuickInput = async (text: string) => {
    if (!activeWorkspace) return;

    setIsProcessing(true);
    try {
      await createTask({
        workspaceId: activeWorkspace.id,
        title: text,
        priority: text.includes('!hoog') ? 'high' : text.includes('!laag') ? 'low' : 'normal',
      });
      await loadData();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskComplete = async (task: Task) => {
    if (task.status === 'completed') {
      await reopenTask(task.id);
    } else {
      await completeTask(task.id);
    }
  };

  const handleTaskPress = (task: Task) => {
    // TODO: Navigate to task detail
    console.log('Task pressed:', task.id);
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    switch (filter) {
      case 'open':
        return task.status !== 'completed';
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  });

  // Sort tasks: priority first, then by deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks at the bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // High priority first
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Earlier deadline first
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;

    // Newest first
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const filterOptions = [
    { value: 'open' as FilterType, label: 'Open' },
    { value: 'completed' as FilterType, label: 'Voltooid' },
    { value: 'all' as FilterType, label: 'Alles' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      {/* Workspace Toggle */}
      <WorkspaceToggle />

      {/* Quick Input */}
      <QuickInput
        onSubmit={handleQuickInput}
        isProcessing={isProcessing}
        placeholder="Nieuwe taak..."
      />

      {/* Filter */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          options={filterOptions}
          selectedValue={filter}
          onValueChange={setFilter}
        />
      </View>

      {/* Task List */}
      <TaskList
        tasks={sortedTasks}
        onTaskPress={handleTaskPress}
        onTaskComplete={handleTaskComplete}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        emptyMessage={
          filter === 'completed'
            ? 'Nog geen voltooide taken'
            : filter === 'open'
            ? 'Alle taken zijn voltooid!'
            : 'Nog geen taken'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
