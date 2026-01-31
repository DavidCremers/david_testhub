import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event, TaskCategory } from '../types/database';
import { CategoryFilter } from '../components/CategoryFilter';

export function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      let query = supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', start.toISOString())
        .lte('start_date', end.toISOString())
        .order('start_date', { ascending: true });

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      Alert.alert('Fout', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [user, currentMonth, activeCategory])
  );

  const deleteEvent = async (eventId: string) => {
    Alert.alert(
      'Event verwijderen',
      'Weet je zeker dat je dit event wilt verwijderen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
              if (error) throw error;
              fetchEvents();
            } catch (error: any) {
              Alert.alert('Fout', error.message);
            }
          },
        },
      ]
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null);

  const hasEventOnDay = (date: Date) => {
    return events.some(event => isSameDay(new Date(event.start_date), date));
  };

  const selectedDayEvents = events.filter(event =>
    isSameDay(new Date(event.start_date), selectedDate)
  );

  const renderDayCell = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    const isSelected = isSameDay(date, selectedDate);
    const hasEvent = hasEventOnDay(date);
    const today = isToday(date);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayCell,
          isSelected && styles.dayCellSelected,
          today && styles.dayCellToday,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.dayTextSelected,
          today && styles.dayTextToday,
        ]}>
          {format(date, 'd')}
        </Text>
        {hasEvent && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onLongPress={() => deleteEvent(item.id)}
    >
      <View style={[
        styles.eventColorBar,
        { backgroundColor: item.category === 'work' ? '#3b82f6' : '#10b981' }
      ]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.eventTime}>
            {item.is_all_day
              ? 'Hele dag'
              : `${format(new Date(item.start_date), 'HH:mm')} - ${format(new Date(item.end_date), 'HH:mm')}`
            }
          </Text>
        </View>
        {item.location && (
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={14} color="#9ca3af" />
            <Text style={styles.eventLocation}>{item.location}</Text>
          </View>
        )}
      </View>
      <View style={[styles.categoryBadge, item.category === 'work' ? styles.categoryWork : styles.categoryPersonal]}>
        <Text style={styles.categoryText}>
          {item.category === 'work' ? 'Werk' : 'Privé'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </Text>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Week Days Header */}
      <View style={styles.weekHeader}>
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {emptyDays.map((_, index) => renderDayCell(null, index))}
        {days.map((day, index) => renderDayCell(day, index))}
      </View>

      {/* Selected Day Events */}
      <View style={styles.selectedDayHeader}>
        <Text style={styles.selectedDayTitle}>
          {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
        </Text>
      </View>

      <FlatList
        data={selectedDayEvents}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchEvents();
            }}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Geen events op deze dag</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem', { type: 'event', date: selectedDate.toISOString() })}
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
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#fff',
  },
  dayTextSelected: {
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#6366f1',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  selectedDayHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 8,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#9ca3af',
  },
  eventLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
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
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
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
