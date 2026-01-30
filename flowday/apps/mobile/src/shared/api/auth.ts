import { getSupabase } from './supabase';
import { createDefaultWorkspaces } from './workspaces';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

/**
 * Convert Supabase user to our User type
 */
function toUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.full_name || null,
    avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
  };
}

/**
 * Sign up a new user
 */
export async function signUp(credentials: RegisterCredentials): Promise<User> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed');

  // Create default workspaces for the new user
  try {
    await createDefaultWorkspaces(data.user.id);
  } catch (workspaceError) {
    console.error('Failed to create default workspaces:', workspaceError);
  }

  return toUser(data.user);
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: LoginCredentials): Promise<User> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Login failed');

  return toUser(data.user);
}

/**
 * Sign in with magic link (passwordless)
 */
export async function signInWithMagicLink(email: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'flowday://auth/callback',
    },
  });

  if (error) throw error;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.message === 'Auth session missing!') return null;
    throw error;
  }

  return data.user ? toUser(data.user) : null;
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

/**
 * Update user profile
 */
export async function updateProfile(updates: { fullName?: string; avatarUrl?: string }): Promise<User> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Update failed');

  return toUser(data.user);
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabase();

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback(toUser(session.user));
    } else {
      callback(null);
    }
  });

  return data.subscription;
}
