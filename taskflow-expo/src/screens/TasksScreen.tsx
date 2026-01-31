import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskCategory } from '../types/database';
import { CategoryFilter } from '../components/CategoryFilter';

export function TasksScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      if (!showCompleted) {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      Alert.alert('Fout', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [user, activeCategory, showCompleted])
  );

  const toggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      fetchTasks();
    } catch (error: any) {
      Alert.alert('Fout', error.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Taak verwijderen',
      'Weet je zeker dat je deze taak wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);
              if (error) throw error;
              fetchTasks();
            } catch (error: any) {
              Alert.alert('Fout', error.message);
            }
          },
        },
      ]
    );
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isToday(date)) return 'Vandaag';
    if (isTomorrow(date)) return 'Morgen';
    return format(date, 'd MMM', { locale: nl });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isOverdue = item.due_date && isPast(new Date(item.due_date)) && !item.is_completed;

    return (
      <TouchableOpacity
        style={[styles.taskCard, item.is_completed && styles.taskCompleted]}
        onLongPress={() => deleteTask(item.id)}
      >
        <TouchableOpacity
          style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}
          onPress={() => toggleComplete(item)}
        >
          {item.is_completed && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskTitle, item.is_completed && styles.taskTitleCompleted]}>
              {item.title}
            </Text>
            <View style={[styles.categoryBadge, item.category === 'work' ? styles.categoryWork : styles.categoryPersonal]}>
              <Text style={styles.categoryText}>
                {item.category === 'work' ? 'Werk' : 'Privé'}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.taskMeta}>
            {item.due_date && (
              <View style={[styles.dueDateBadge, isOverdue && styles.overdueBadge]}>
                <Ionicons name="calendar-outline" size={12} color={isOverdue ? '#ef4444' : '#9ca3af'} />
                <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
                  {formatDueDate(item.due_date)}
                </Text>
              </View>
            )}
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            {item.import_source === 'voice' && (
              <Ionicons name="mic" size={14} color="#6366f1" style={styles.sourceIcon} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowCompleted(!showCompleted)}
        >
          <Ionicons
            name={showCompleted ? 'eye' : 'eye-off'}
            size={16}
            color="#6b7280"
          />
          <Text style={styles.filterText}>
            {showCompleted ? 'Verberg voltooide' : 'Toon voltooide'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTasks();
            }}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>Geen taken</Text>
            <Text style={styles.emptySubtitle}>
              Tik op + om een nieuwe taak toe te voegen
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem', { type: 'task' })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: '#6b7280',
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b5563',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryWork: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  categoryPersonal: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  taskDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueBadge: {},
  dueDateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  overdueText: {
    color: '#ef4444',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceIcon: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
