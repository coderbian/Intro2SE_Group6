import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

function getRequiredEnvVar(name: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Environment variable "${name}" is required but was not provided. ` +
      `Ensure it is defined in your environment (e.g., .env) before starting the app.`
    )
  }
  return value
}
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = getRequiredEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
  const supabaseAnonKey = getRequiredEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

function createInMemoryStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  }
}

// Creates an auth client that won't persist or overwrite the app's current session.
// Useful for credential verification flows (e.g., verifying the current password)
// without triggering unwanted auth side effects in the main client.
export function createEphemeralSupabaseClient() {
  const supabaseUrl = getRequiredEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
  const supabaseAnonKey = getRequiredEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: createInMemoryStorage(),
    },
  })
}