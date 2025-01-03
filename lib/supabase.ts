import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a server-side Supabase client
const createServerClient = () => createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Create a client-side Supabase client with persistent session handling
const createBrowserClient = () => createClientComponentClient();

// Export the appropriate client based on the environment
export const supabase = typeof window === 'undefined' 
  ? createServerClient()
  : createBrowserClient();
