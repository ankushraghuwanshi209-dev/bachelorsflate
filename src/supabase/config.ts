import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function sanitizeConfigValue(val: unknown): string {
  if (typeof val !== 'string') return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

const supabaseUrl = sanitizeConfigValue(
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL
);
const supabaseAnonKey = sanitizeConfigValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your_project_id') &&
  !supabaseUrl.includes('your_supabase_url') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.startsWith('your_') &&
  !supabaseAnonKey.includes('your-supabase')
);

export let isSupabaseConfigured = isConfigured;
export let supabase: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.info('Supabase initialized successfully.');
  } catch (error) {
    console.warn('Supabase initialization failed, falling back to local simulated mode:', error);
    supabase = null;
    isSupabaseConfigured = false;
  }
} else {
  console.info('Supabase configuration missing or placeholder values. Running in Bachelors Flat Demo / Local Storage mode.');
}
