import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addHours } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TaskCategory, TaskPriority } from '../types/database';
import { VoiceInput } from '../components/VoiceInput';
import { parseVoiceInput } from '../lib/voiceParser';

type ItemType = 'task' | 'event';

export function AddItemScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();

  const [itemType, setItemType] = useState<ItemType>(route.params?.type || 'task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date>(
    route.params?.date ? new Date(route.params.date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(addHours(startDate, 1));
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  const handleVoiceResult = (transcript: string) => {
    const parsed = parseVoiceInput(transcript);

    setTitle(parsed.title);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.priority) setPriority(parsed.priority);
    if (parsed.isEvent) {
      setItemType('event');
      if (parsed.dateTime) setStartDate(parsed.dateTime);
    } else if (parsed.dateTime) {
      setDueDate(parsed.dateTime);
    }

    setShowVoice(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Fout', 'Vul een titel in');
      return;
    }

    if (!user) {
      Alert.alert('Fout', 'Je bent niet ingelogd');
      return;
    }

    setLoading(true);

    try {
      if (itemType === 'task') {
        const { error } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          due_date: dueDate?.toISOString() || null,
          is_completed: false,
          import_source: showVoice ? 'voice' : 'manual',
          tags: [],
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('events').insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          start_date: startDate.toISOString(),
          end_date: isAllDay ? startDate.toISOString() : endDate.toISOString(),
          is_all_day: isAllDay,
          location: location.trim() || null,
          import_source: showVoice ? 'voice' : 'manual',
          attendees: [],
        });

        if (error) throw error;
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Fout', error.message);
    } finally {
      setLoading(false);
    }
  };

  const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Laag', color: '#22c55e' },
    { value: 'medium', label: 'Normaal', color: '#eab308' },
    { value: 'high', label: 'Hoog', color: '#f97316' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'task' && styles.typeButtonActive]}
            onPress={() => setItemType('task')}
          >
            <Ionicons
              name="checkbox-outline"
              size={20}
              color={itemType === 'task' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.typeText, itemType === 'task' && styles.typeTextActive]}>
              Taak
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'event' && styles.typeButtonActive]}
            onPress={() => setItemType('event')}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={itemType === 'event' ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.typeText, itemType === 'event' && styles.typeTextActive]}>
              Event
            </Text>
          </TouchableOpacity>
        </View>

        {/* Voice Input Button */}
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => setShowVoice(true)}
        >
          <Ionicons name="mic" size={24} color="#6366f1" />
          <Text style={styles.voiceButtonText}>Spreek in om toe te voegen</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titel</Text>
          <TextInput
            style={styles.input}
            placeholder={itemType === 'task' ? 'Wat moet je doen?' : 'Naam van het event'}
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Beschrijving</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Voeg details toe..."
            placeholderTextColor="#6b7280"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categorie</Text>
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[styles.categoryButton, category === 'work' && styles.categoryButtonWork]}
              onPress={() => setCategory('work')}
            >
              <Ionicons
                name="briefcase"
                size={18}
                color={category === 'work' ? '#fff' : '#6b7280'}
              />
              <Text style={[styles.categoryButtonText, category === 'work' && styles.categoryButtonTextActive]}>
                Werk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, category === 'personal' && styles.categoryButtonPersonal]}
              onPress={() => setCategory('personal')}
            >
              <Ionicons
                name="home"
                size={18}
                color={category === 'personal' ? '#fff' : '#6b7280'}
              />
              <Text style={[styles.categoryButtonText, category === 'personal' && styles.categoryButtonTextActive]}>
                Privé
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task-specific: Priority */}
        {itemType === 'task' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prioriteit</Text>
            <View style={styles.priorityButtons}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityButton,
                    priority === p.value && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p.value && styles.priorityButtonTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Event-specific: Location */}
        {itemType === 'event' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Locatie</Text>
            <TextInput
              style={styles.input}
              placeholder="Waar vindt het plaats?"
              placeholderTextColor="#6b7280"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        )}

        {/* Event-specific: All Day Toggle */}
        {itemType === 'event' && (
          <TouchableOpacity
            style={styles.allDayRow}
            onPress={() => setIsAllDay(!isAllDay)}
          >
            <Text style={styles.allDayText}>Hele dag</Text>
            <View style={[styles.toggle, isAllDay && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isAllDay && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Date/Time Display (simplified - full date picker would need additional library) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {itemType === 'task' ? 'Deadline' : 'Datum'}
          </Text>
          <View style={styles.dateDisplay}>
            <Ionicons name="calendar" size={20} color="#9ca3af" />
            <Text style={styles.dateText}>
              {itemType === 'task'
                ? dueDate
                  ? format(dueDate, 'dd-MM-yyyy HH:mm')
                  : 'Geen deadline'
                : format(startDate, 'dd-MM-yyyy HH:mm')
              }
            </Text>
          </View>
          <Text style={styles.dateHint}>
            Tip: Gebruik spraakherkenning om datum/tijd in te stellen
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.submitText}>
            {loading ? 'Opslaan...' : itemType === 'task' ? 'Taak toevoegen' : 'Event toevoegen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Input Modal */}
      {showVoice && (
        <VoiceInput
          onResult={handleVoiceResult}
          onClose={() => setShowVoice(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
  },
  typeText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#fff',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderStyle: 'dashed',
  },
  voiceButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryButtonWork: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonPersonal: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryButtonText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  priorityButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  allDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  allDayText: {
    fontSize: 16,
    color: '#fff',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#374151',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6366f1',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  dateHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
