// ==============================================================================
// CARVLAK GROUP - CLIENTE SUPABASE & DATA ADAPTER
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const getEnvOrStorage = (envKey: string, storageKey: string): string => {
  const envVal = (import.meta.env as any)?.[envKey];
  if (envVal && typeof envVal === 'string' && !envVal.includes('TU_PROYECTO') && envVal.length > 5) {
    return envVal.trim();
  }
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && !stored.includes('TU_PROYECTO') && stored.length > 5) {
      return stored.trim();
    }
  } catch {}
  return '';
};

export const supabaseUrl = getEnvOrStorage('VITE_SUPABASE_URL', 'carvlak_supabase_url');
export const supabaseAnonKey = getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'carvlak_supabase_anon_key');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://')) &&
  supabaseUrl !== 'https://TU_PROYECTO.supabase.co' &&
  !supabaseUrl.includes('TU_PROYECTO')
);

let clientInstance = null;
if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Error inicializando cliente de Supabase:', err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;
