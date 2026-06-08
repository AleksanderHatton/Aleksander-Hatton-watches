import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this as a warning so the app still builds before env vars are added.
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase calls will fail until env vars are configured.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export async function getCurrentUserProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email || profile?.email || '',
    name: profile?.name || user.user_metadata?.name || user.email || 'Client',
    phone: profile?.phone || user.user_metadata?.phone || '',
    role: profile?.role || 'customer',
  };
}
