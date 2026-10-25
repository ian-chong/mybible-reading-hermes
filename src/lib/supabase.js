import { createClient } from '@supabase/supabase-js';

// Set in Vercel env vars and .env.local. Without them the app runs in guest mode only.
const url = import.meta.env?.VITE_SUPABASE_URL;
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

// PKCE returns ?code= in the query string, so sign-in redirects don't collide with the
// app's #/hash routes.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;

export const accountsEnabled = Boolean(supabase);

// Social sign-in buttons to show, e.g. "google,apple" — each must be set up in Supabase first.
// Email sign-in links always work.
export const authProviders = (import.meta.env?.VITE_AUTH_PROVIDERS ?? '').split(',').map((p) => p.trim()).filter(Boolean);

// Sign-in returns here; the app opens on Today and the session is picked up from the URL.
const redirectTo = () => `${window.location.origin}/`;

export const signInWithEmail = (email) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });

export const signInWithProvider = (provider) =>
  supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });

export const signOut = () => supabase.auth.signOut();

export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('display_name, avatar_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId, { displayName }) {
  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    display_name: displayName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
