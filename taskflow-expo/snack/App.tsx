import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Category = 'work' | 'personal';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  completed: boolean;
  createdAt: Date;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('tasks');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Fout', 'Vul een titel in');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      completed: false,
      createdAt: new Date(),
    };

    setTasks([task, ...tasks]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    Alert.alert('Verwijderen', 'Weet je het zeker?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Verwijderen', style: 'destructive', onPress: () =>
        setTasks(tasks.filter(t => t.id !== id))
      },
    ]);
  };

  const filteredTasks = activeCategory === 'all'
    ? tasks
    : tasks.filter(t => t.category === activeCategory);

  const getPriorityColor = (priority: Priority) => {
    const colors = { low: '#22c55e', medium: '#eab308', high: '#f97316', urgent: '#ef4444' };
    return colors[priority];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TaskFlow</Text>
        <Text style={styles.headerSubtitle}>{tasks.filter(t => !t.completed).length} taken open</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        {(['all', 'work', 'personal'] as const).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive,
              cat === 'work' && activeCategory === cat && styles.categoryBtnWork,
              cat === 'personal' && activeCategory === cat && styles.categoryBtnPersonal,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Ionicons
              name={cat === 'all' ? 'apps' : cat === 'work' ? 'briefcase' : 'home'}
              size={16}
              color={activeCategory === cat ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat === 'all' ? 'Alles' : cat === 'work' ? 'Werk' : 'Privé'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.taskCard, item.completed && styles.taskCompleted]}
            onLongPress={() => deleteTask(item.id)}
          >
            <TouchableOpacity
              style={[styles.checkbox, item.completed && styles.checkboxChecked]}
              onPress={() => toggleTask(item.id)}
            >
              {item.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                {item.title}
              </Text>
              <View style={styles.taskMeta}>
                <View style={[styles.badge, item.category === 'work' ? styles.badgeWork : styles.badgePersonal]}>
                  <Text style={styles.badgeText}>{item.category === 'work' ? 'Werk' : 'Privé'}</Text>
                </View>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkbox-outline" size={64} color="#374151" />
            <Text style={styles.emptyTitle}>Geen taken</Text>
            <Text style={styles.emptyText}>Tik op + om een taak toe te voegen</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nieuwe Taak</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Wat moet je doen?"
              placeholderTextColor="#6b7280"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            <Text style={styles.label}>Categorie</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionBtn, newTaskCategory === 'work' && styles.optionBtnWork]}
                onPress={() => setNewTaskCategory('work')}
              >
                <Ionicons name="briefcase" size={18} color={newTaskCategory === 'work' ? '#fff' : '#6b7280'} />
                <Text style={[styles.optionText, newTaskCategory === 'work' && styles.optionTextActive]}>Werk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, newTaskCategory === 'personal' && styles.optionBtnPersonal]}
                onPress={() => setNewTaskCategory('personal')}
              >
                <Ionicons name="home" size={18} color={newTaskCategory === 'personal' ? '#fff' : '#6b7280'} />
                <Text style={[styles.optionText, newTaskCategory === 'personal' && styles.optionTextActive]}>Privé</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Prioriteit</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityBtn, newTaskPriority === p && { backgroundColor: getPriorityColor(p) }]}
                  onPress={() => setNewTaskPriority(p)}
                >
                  <Text style={[styles.priorityText, newTaskPriority === p && styles.priorityTextActive]}>
                    {p === 'low' ? 'Laag' : p === 'medium' ? 'Normaal' : p === 'high' ? 'Hoog' : 'Urgent'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={addTask}>
              <Text style={styles.submitText}>Toevoegen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  categoryFilter: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1f2937' },
  categoryBtnActive: { backgroundColor: '#6366f1' },
  categoryBtnWork: { backgroundColor: '#3b82f6' },
  categoryBtnPersonal: { backgroundColor: '#10b981' },
  categoryText: { fontSize: 14, color: '#6b7280' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  taskCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row' },
  taskCompleted: { opacity: 0.5 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#4b5563', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#6b7280' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeWork: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  badgePersonal: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  input: { backgroundColor: '#111827', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  optionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', borderRadius: 12, padding: 14 },
  optionBtnWork: { backgroundColor: '#3b82f6' },
  optionBtnPersonal: { backgroundColor: '#10b981' },
  optionText: { fontSize: 15, color: '#6b7280' },
  optionTextActive: { color: '#fff' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  priorityBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: '#111827' },
  priorityText: { fontSize: 12, color: '#6b7280' },
  priorityTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
