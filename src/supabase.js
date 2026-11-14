

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ombkpydozsafvflkessl.supabase.co';
const supabaseKey = 'sb_publishable_VYlUBLzkHE870XLb1cQPdA_mOEBSk3X';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
