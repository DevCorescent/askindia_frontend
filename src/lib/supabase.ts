import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Always true — the app now uses the Express backend, not Supabase directly.
// Pages that gate real API calls on this flag will always use the backend.
export const isSupabaseConfigured = true;

export const supabase = createClient<Database>(
  supabaseUrl      ?? 'https://placeholder.supabase.co',
  supabaseAnonKey  ?? 'placeholder_anon_key',
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
    },
  }
);
