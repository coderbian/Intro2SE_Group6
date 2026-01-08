import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './index.js';

// Use 'any' for database type to avoid strict type inference issues
// until proper database types are generated from Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDatabase = any;

let supabaseClient: SupabaseClient<AnyDatabase> | null = null;
let supabaseAdminClient: SupabaseClient<AnyDatabase> | null = null;

/**
 * Get Supabase client (uses anon key - respects RLS)
 */
export function getSupabaseClient(): SupabaseClient<AnyDatabase> {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.anonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }
  return supabaseClient;
}

/**
 * Get Supabase Admin client (uses service role key - bypasses RLS)
 * Use with caution - only for admin operations
 */
export function getSupabaseAdminClient(): SupabaseClient<AnyDatabase> {
  if (!supabaseAdminClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase URL and Service Role Key are required');
    }
    supabaseAdminClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminClient;
}

/**
 * Create a Supabase client with a specific JWT token
 * Used for authenticated requests on behalf of a user
 */
export function getSupabaseClientWithAuth(accessToken: string): SupabaseClient<AnyDatabase> {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }
  
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

export default {
  getSupabaseClient,
  getSupabaseAdminClient,
  getSupabaseClientWithAuth,
};
