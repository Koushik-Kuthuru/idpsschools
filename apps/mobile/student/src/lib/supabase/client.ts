import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://knvlfvirhcdihcuzioop.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_5l_GGturSgLYknzpWlhZxA_zbcEHTmT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
