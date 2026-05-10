import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingSupabaseConfig = !supabaseUrl || !supabaseAnonKey;

if (missingSupabaseConfig) {
  // Vite env vars must exist at build-time. On Vercel, if they are not configured as Build-time,
  // importing supabase hard-crashes the app. We keep the app renderable and fail gracefully at runtime.
  console.error(
    '❌ Supabase config missing! Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as Vercel Build-time environment variables.'
  );
}

// Safe fallback values to keep module import from crashing.
// Any attempt to call auth/db will likely fail, but UI can still boot.
const safeUrl = (supabaseUrl || 'https://invalid.supabase.co').replace(/\/$/, '');
const safeAnonKey = (supabaseAnonKey || 'invalid-anon-key');

export const supabase = createClient(safeUrl, safeAnonKey);

export const isSupabaseConfigured = !missingSupabaseConfig;


