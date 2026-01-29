import { useEffect, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useWorkspaceStore } from '../../src/stores/workspace';
import { useTasksStore } from '../../src/stores/tasks';
import { useEventsStore } from '../../src/stores/events';
import { useColors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { Text, Card } from '../../src/components/ui';
import { TaskItem } from '../../src/components/tasks';
import { WorkspaceToggle } from '../../src/components/workspace/WorkspaceToggle';
import { QuickInput } from '../../src/components/common/QuickInput';
import type { Task } from '@flowday/shared';

export default function TodayScreen() {
  const colors = useColors();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const {
    todayTasks,
    upcomingTasks,
    loadTodayTasks,
    loadUpcomingTasks,
    completeTask,
    createTask,
  } = useTasksStore();
  const { todayEvents, loadTodayEvents } = useEventsStore();

  const loadData = useCallback(async () => {
    if (!activeWorkspace) return;

    await Promise.all([
      loadTodayTasks(activeWorkspace.id),
      loadUpcomingTasks(activeWorkspace.id, 3),
      loadTodayEvents(activeWorkspace.id),
    ]);
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
      // Simple parsing for now - create a basic task
      // TODO: Add Claude API for natural language parsing
      await createTask({
        workspaceId: activeWorkspace.id,
        title: text,
        priority: text.includes('!hoog') ? 'high' : text.includes('!laag') ? 'low' : 'normal',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskComplete = async (task: Task) => {
    await completeTask(task.id);
  };

  const handleTaskPress = (task: Task) => {
    // TODO: Navigate to task detail
    console.log('Task pressed:', task.id);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Workspace Toggle */}
      <WorkspaceToggle />

      {/* Quick Input */}
      <QuickInput
        onSubmit={handleQuickInput}
        isProcessing={isProcessing}
        placeholder="Nieuwe taak of afspraak..."
      />

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <View style={styles.section}>
          <Text variant="headline" style={styles.sectionTitle}>
            Agenda
          </Text>
          <Card>
            {todayEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                <View style={styles.eventContent}>
                  <Text variant="subheadline">{event.title}</Text>
                  <Text variant="caption1" color="secondary">
                    {event.startTime.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {event.endTime && ` - ${event.endTime.toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      )}

      {/* Today's Tasks */}
      <View style={styles.section}>
        <Text variant="headline" style={styles.sectionTitle}>
          Taken voor vandaag
        </Text>
        {todayTasks.length > 0 ? (
          todayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={handleTaskPress}
              onComplete={handleTaskComplete}
              showDeadline={false}
            />
          ))
        ) : (
          <Card>
            <Text variant="body" color="secondary" style={styles.emptyText}>
              Geen taken voor vandaag 🎉
            </Text>
          </Card>
        )}
      </View>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <View style={styles.section}>
          <Text variant="headline" style={styles.sectionTitle}>
            Binnenkort
          </Text>
          {upcomingTasks.slice(0, 5).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPress={handleTaskPress}
              onComplete={handleTaskComplete}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {todayTasks.length === 0 && upcomingTasks.length === 0 && todayEvents.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="title3" style={styles.emptyStateTitle}>
            Welkom bij Flowday!
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyStateText}>
            Gebruik het invoerveld hierboven om je eerste taak of afspraak toe te voegen.
          </Text>
        </View>
      )}
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
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    textAlign: 'center',
  },
});
