import { createClient } from '@supabase/supabase-js'

function getRequiredEnvVar(name: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Environment variable "${name}" is required but was not provided. ` +
      `Ensure it is defined in your environment (e.g., .env) before starting the app.`
    )
  }
  return value
}
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = getRequiredEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
  const supabaseAnonKey = getRequiredEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}