import { useEffect, useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useWorkspaceStore } from '../../src/stores/workspace';
import { useEventsStore } from '../../src/stores/events';
import { useColors } from '../../src/theme/colors';
import { spacing, radius } from '../../src/theme/spacing';
import { Text, Card, SegmentedControl } from '../../src/components/ui';
import { WorkspaceToggle } from '../../src/components/workspace/WorkspaceToggle';
import { QuickInput } from '../../src/components/common/QuickInput';
import { formatDate, formatTime, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../../src/shared';
import type { CalendarEvent } from '../../src/shared';

type ViewType = 'day' | 'week' | 'month';

export default function AgendaScreen() {
  const colors = useColors();
  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { events, loadEventsInRange, createEvent } = useEventsStore();

  const getDateRange = useCallback(() => {
    switch (viewType) {
      case 'day':
        return {
          start: new Date(selectedDate.setHours(0, 0, 0, 0)),
          end: new Date(selectedDate.setHours(23, 59, 59, 999)),
        };
      case 'week':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
    }
  }, [viewType, selectedDate]);

  const loadData = useCallback(async () => {
    if (!activeWorkspace) return;
    const { start, end } = getDateRange();
    await loadEventsInRange(activeWorkspace.id, start, end);
  }, [activeWorkspace?.id, getDateRange]);

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
      // Simple parsing for now - create a basic event
      // TODO: Add Claude API for natural language parsing
      const now = new Date();
      await createEvent({
        workspaceId: activeWorkspace.id,
        title: text,
        startTime: now,
        endTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
      });
      await loadData();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    // TODO: Navigate to event detail
    console.log('Event pressed:', event.id);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewType === 'day' ? 1 : viewType === 'week' ? 7 : 30;
    const multiplier = direction === 'prev' ? -1 : 1;
    setSelectedDate(addDays(selectedDate, days * multiplier));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const viewOptions = [
    { value: 'day' as ViewType, label: 'Dag' },
    { value: 'week' as ViewType, label: 'Week' },
    { value: 'month' as ViewType, label: 'Maand' },
  ];

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = event.startTime.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      {/* Workspace Toggle */}
      <WorkspaceToggle />

      {/* Quick Input */}
      <QuickInput
        onSubmit={handleQuickInput}
        isProcessing={isProcessing}
        placeholder="Nieuwe afspraak..."
      />

      {/* View Type Selector */}
      <View style={styles.viewSelector}>
        <SegmentedControl
          options={viewOptions}
          selectedValue={viewType}
          onValueChange={setViewType}
        />
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
          <Text variant="headline" color="link">
            ‹
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text variant="headline">{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
          <Text variant="headline" color="link">
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {sortedDates.length > 0 ? (
          sortedDates.map((dateKey) => (
            <View key={dateKey} style={styles.dateSection}>
              <Text variant="subheadline" color="secondary" style={styles.dateHeader}>
                {formatDate(new Date(dateKey))}
              </Text>
              <Card>
                {eventsByDate[dateKey]
                  .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                  .map((event, index) => (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => handleEventPress(event)}
                      style={[
                        styles.eventItem,
                        index < eventsByDate[dateKey].length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.separator,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.eventIndicator,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                      <View style={styles.eventTime}>
                        <Text variant="subheadline">
                          {formatTime(event.startTime)}
                        </Text>
                        {event.endTime && (
                          <Text variant="caption1" color="secondary">
                            {formatTime(event.endTime)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.eventContent}>
                        <Text variant="body" numberOfLines={1}>
                          {event.title}
                        </Text>
                        {event.location && (
                          <Text variant="caption1" color="secondary" numberOfLines={1}>
                            📍 {event.location}
                          </Text>
                        )}
                      </View>
                      <Text variant="body" color="tertiary">
                        ›
                      </Text>
                    </TouchableOpacity>
                  ))}
              </Card>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text variant="body" color="secondary" style={styles.emptyText}>
              Geen afspraken in deze periode
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewSelector: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  eventIndicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  eventTime: {
    width: 50,
    marginRight: spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    textAlign: 'center',
  },
});
