import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

// Client-side Supabase client (secure, respects RLS)
export const createBrowserClient = () => {
  return createClientComponentClient<Database>()
}

// Auth helpers with error handling
export async function signInWithEmail(email: string, password: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const supabase = createBrowserClient()

  // Basic validation
  if (password.length < 8) {
    throw new Error('Wachtwoord moet minimaal 8 tekens zijn')
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: { full_name: fullName?.trim() }
    }
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signInWithGoogle() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession() {
  const supabase = createBrowserClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return session
}

export async function getUser() {
  const supabase = createBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  return user
}
