import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Get environment variables with proper client-side handling
function getSupabaseConfig() {
  // For client-side, use the global env object that Next.js injects
  const supabaseUrl =
    typeof window !== 'undefined'
      ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL ||
        'https://zemjgjofmefmffwrrufr.supabase.co'
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabaseAnonKey =
    typeof window !== 'undefined'
      ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWpnam9mbWVmbWZmd3JydWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzE5NjMsImV4cCI6MjA3MjEwNzk2M30.6x36wX7FPHDdYkjEY_Gp-6IWjYxg_-ch43SAi41Q4qw'
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (server-only)
export const supabaseAdmin =
  typeof window === 'undefined'
    ? createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
