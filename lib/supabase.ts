import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client with persistent session handling
export const supabase = typeof window !== 'undefined' 
  ? createClientComponentClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

// Function to fetch Twilio credentials for a specific user
export async function fetchTwilioCredentials(userId: string) {
  const { data, error } = await supabase
    .from('twilio_credentials')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching Twilio credentials:', error);
    throw error;
  }

  return data;
}