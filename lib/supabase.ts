import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Auto-detect and format if the user config only provides the project reference ID
const supabaseUrl = rawUrl && !rawUrl.includes('://') 
  ? `https://${rawUrl}.supabase.co` 
  : rawUrl;

// Lazy check to see if Supabase config is provided, starts with valid protocol, and is not default placeholder values
const isConfigured = 
  supabaseUrl && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key';

// Lazy client generation to adhere to system instructions and avoid crashing if config is absent
export const getSupabaseClient = () => {
  if (!isConfigured) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};
