import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Task } from '@flowday/shared';
import { formatDeadline } from '@flowday/shared';
import { useColors, priorityColors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';
import { Text } from '../ui/Text';
import { useColorScheme } from 'react-native';

interface TaskItemProps {
  task: Task;
  onPress?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  showDeadline?: boolean;
}

export function TaskItem({
  task,
  onPress,
  onComplete,
  showDeadline = true,
}: TaskItemProps) {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isCompleted = task.status === 'completed';

  const handleComplete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.(task);
  };

  const handlePress = () => {
    onPress?.(task);
  };

  const priorityColor =
    colorScheme === 'dark'
      ? priorityColors[task.priority].dark
      : priorityColors[task.priority].light;

  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: colors.secondaryGroupedBackground },
      ]}
    >
      {/* Checkbox */}
      <Pressable onPress={handleComplete} style={styles.checkboxContainer}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.systemGreen : priorityColor,
              backgroundColor: isCompleted ? colors.systemGreen : 'transparent',
            },
          ]}
        >
          {isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <Text
          variant="body"
          style={[
            isCompleted && {
              textDecorationLine: 'line-through',
              color: colors.tertiaryLabel,
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Metadata row */}
        <View style={styles.metadata}>
          {/* Priority indicator */}
          {task.priority === 'high' && !isCompleted && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
              <Text variant="caption2" style={{ color: priorityColor }}>
                Hoog
              </Text>
            </View>
          )}

          {/* Labels */}
          {task.labels?.slice(0, 2).map((label) => (
            <View
              key={label.id}
              style={[styles.label, { backgroundColor: label.color + '20' }]}
            >
              <Text variant="caption2" style={{ color: label.color }}>
                {label.name}
              </Text>
            </View>
          ))}

          {/* Deadline */}
          {showDeadline && deadlineInfo && !isCompleted && (
            <Text
              variant="caption1"
              style={[
                styles.deadline,
                {
                  color: deadlineInfo.isOverdue
                    ? colors.systemRed
                    : deadlineInfo.urgency === 'urgent'
                    ? colors.systemOrange
                    : colors.secondaryLabel,
                },
              ]}
            >
              {deadlineInfo.text}
            </Text>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Text variant="body" color="tertiary" style={styles.chevron}>
        ›
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  checkboxContainer: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  deadline: {
    marginLeft: 'auto',
  },
  chevron: {
    fontSize: 20,
    marginLeft: spacing.sm,
  },
});
