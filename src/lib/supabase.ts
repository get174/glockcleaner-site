import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase config missing! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  throw new Error('Supabase configuration is required');
}

console.log('✅ Supabase initialized:', supabaseUrl.replace(/\/auth\/v1$/, ''));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

