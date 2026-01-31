import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCategory } from '../types/database';

interface CategoryFilterProps {
  activeCategory: TaskCategory | 'all';
  onCategoryChange: (category: TaskCategory | 'all') => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: { value: TaskCategory | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'all', label: 'Alles', icon: 'apps' },
    { value: 'work', label: 'Werk', icon: 'briefcase' },
    { value: 'personal', label: 'Privé', icon: 'home' },
  ];

  return (
    <View style={styles.container}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.value}
          style={[
            styles.button,
            activeCategory === cat.value && styles.buttonActive,
            cat.value === 'work' && activeCategory === cat.value && styles.buttonWork,
            cat.value === 'personal' && activeCategory === cat.value && styles.buttonPersonal,
          ]}
          onPress={() => onCategoryChange(cat.value)}
        >
          <Ionicons
            name={cat.icon}
            size={16}
            color={activeCategory === cat.value ? '#fff' : '#6b7280'}
          />
          <Text
            style={[
              styles.text,
              activeCategory === cat.value && styles.textActive,
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  buttonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  buttonWork: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonPersonal: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  textActive: {
    color: '#fff',
  },
});
