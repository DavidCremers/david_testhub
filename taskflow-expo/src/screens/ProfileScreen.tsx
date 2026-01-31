import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, signOut } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Task, Event } from '../types/database';

export function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    workTasks: 0,
    personalTasks: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.log('Profile error:', error.message);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      // Get tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      // Get upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', new Date().toISOString());

      if (tasks) {
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.is_completed).length,
          workTasks: tasks.filter(t => t.category === 'work').length,
          personalTasks: tasks.filter(t => t.category === 'personal').length,
          upcomingEvents: events?.length || 0,
        });
      }
    } catch (error: any) {
      console.log('Stats error:', error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Uitloggen',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Fout', error.message);
            }
          },
        },
      ]
    );
  };

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#1f2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#6366f1" />
          </View>
        </View>
        <Text style={styles.name}>
          {profile?.full_name || user?.email?.split('@')[0] || 'Gebruiker'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Taken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Voltooid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verdeling</Text>

        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.categoryLabel}>Werk</Text>
          </View>
          <Text style={styles.categoryValue}>{stats.workTasks} taken</Text>
        </View>

        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.categoryLabel}>Privé</Text>
          </View>
          <Text style={styles.categoryValue}>{stats.personalTasks} taken</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instellingen</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#9ca3af" />
          <Text style={styles.menuText}>Meldingen</Text>
          <Ionicons name="chevron-forward" size={20} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="color-palette-outline" size={22} color="#9ca3af" />
          <Text style={styles.menuText}>Thema</Text>
          <Ionicons name="chevron-forward" size={20} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language-outline" size={22} color="#9ca3af" />
          <Text style={styles.menuText}>Taal spraakherkenning</Text>
          <Text style={styles.menuValue}>Nederlands</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#9ca3af" />
          <Text style={styles.menuText}>Privacy & Beveiliging</Text>
          <Ionicons name="chevron-forward" size={20} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={22} color="#9ca3af" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#4b5563" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={[styles.menuText, styles.menuTextDanger]}>Uitloggen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TaskFlow v1.0.0</Text>
        <Text style={styles.footerText}>Beveiligd met Row Level Security</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#fff',
  },
  categoryValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuItemDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  menuTextDanger: {
    color: '#ef4444',
  },
  menuValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
});
