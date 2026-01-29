import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Initialize the Supabase client
 */
export function initSupabase(config: SupabaseConfig): SupabaseClient<Database> {
  if (!config.url || !config.anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  supabaseInstance = createClient<Database>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

/**
 * Get the Supabase client instance
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initSupabase first.');
  }
  return supabaseInstance;
}

/**
 * Check if Supabase is initialized
 */
export function isSupabaseInitialized(): boolean {
  return supabaseInstance !== null;
}
