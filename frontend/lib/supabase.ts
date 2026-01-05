import { createClient } from '@supabase/supabase-js';

// Evita quebra quando variáveis não estão configuradas em ambiente de teste
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dummy-supabase-url.invalid';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
