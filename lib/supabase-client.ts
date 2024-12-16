import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a singleton instance of the Supabase client
export const supabase = createClientComponentClient();
