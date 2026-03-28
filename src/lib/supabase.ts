import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
const isConfigured = supabaseUrl && supabaseUrl !== 'your_supabase_project_url' && 
                     supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key';

// Create a mock client for demo mode when Supabase is not configured
const createMockClient = () => {
  return {
    auth: {
      signInWithPassword: async () => ({ data: { user: null }, error: new Error('Demo mode') }),
      signUp: async () => ({ data: { user: null }, error: new Error('Demo mode') }),
      signOut: async () => {},
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
      }),
      insert: async () => ({ error: null }),
    }),
  } as unknown as ReturnType<typeof createClient<Database>>;
};

export const supabase = isConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createMockClient();

export const isSupabaseConfigured = isConfigured;

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];
