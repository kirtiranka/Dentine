// Inside your local file: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'; // <-- From node_modules
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This is what '../lib/supabase' actually exports:
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);