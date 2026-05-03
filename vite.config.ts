import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __SUPABASE_URL__: JSON.stringify(import.meta.env.VITE_SUPABASE_URL || 'MISSING'),
    __SUPABASE_ANON_KEY__: JSON.stringify(import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING'),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
