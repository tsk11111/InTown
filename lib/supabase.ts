import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export function isConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase timeout')), ms)
    ),
  ]);
}

export async function uploadPhoto(localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const path = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from('event-photos')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
  return data.publicUrl;
}
