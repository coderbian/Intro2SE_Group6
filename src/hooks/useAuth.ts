/**
 * Re-export useSupabaseAuth for backward compatibility
 * This file now wraps Supabase authentication
 */
export { useSupabaseAuth as useAuth, type User } from './useSupabaseAuth';
