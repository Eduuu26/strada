import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '../env';

let client: SupabaseClient | null = null;

/**
 * Lock sin bloqueo. supabase-js usa navigator.locks en web para serializar el
 * acceso a la sesión, pero en navegadores embebidos / webviews (como el de
 * Cursor o un WebView móvil) esa API puede no resolver nunca y deja colgadas
 * TODAS las peticiones (login, getSession, consultas a tablas). Ejecutamos la
 * función directamente: la app es de una sola pestaña por usuario, así que no
 * necesitamos el lock entre pestañas.
 */
async function noOpLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  return fn();
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado. Añade EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  if (!client) {
    client = createClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: noOpLock,
      },
    });
  }
  return client;
}

export function tryGetSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return getSupabase();
}
