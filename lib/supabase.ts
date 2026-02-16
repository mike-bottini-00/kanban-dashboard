import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

// Lazy-initialized clients to avoid build-time crashes when env vars are missing
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(
        requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
        requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey)
      );
    }
    return (_supabase as any)[prop];
  },
});

// Admin client for API routes (server-only)
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (typeof window !== 'undefined') {
      throw new Error('supabaseAdmin is server-only');
    }

    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(
        requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
        requireEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey)
      );
    }
    return (_supabaseAdmin as any)[prop];
  },
});
