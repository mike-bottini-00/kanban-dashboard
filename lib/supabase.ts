import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qmiauqjqujumizibsyhn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Needs to be provided in env

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for API routes
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaWF1cWpxdWp1bWl6aWJzeWhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk3NjA0NCwiZXhwIjoyMDg2NTUyMDQ0fQ.wxzO34lbMNcvWAc0ldIHhkOWTGMlV7nUeC9P-KIHDVw'
);
