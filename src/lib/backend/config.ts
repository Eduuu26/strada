import { getStradaEmailApiFromExtra, getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '../env';

/** Proveedor activo. Orden de prioridad configurable por env. */
export type BackendProvider = 'local' | 'supabase' | 'strada-api';

function readProviderOverride(): BackendProvider | null {
  const raw = process.env.EXPO_PUBLIC_BACKEND_PROVIDER?.trim().toLowerCase();
  if (raw === 'local' || raw === 'supabase' || raw === 'strada-api') return raw;
  return null;
}

/** URL del API Strada propio (hoy puede ser el mismo host que el servidor de email). */
export function getStradaApiUrl(): string | null {
  const dedicated = process.env.EXPO_PUBLIC_STRADA_API_URL?.trim();
  if (dedicated) return dedicated.replace(/\/$/, '');
  const emailApi = getStradaEmailApiFromExtra();
  if (emailApi) return emailApi.replace(/\/$/, '');
  return null;
}

export function getBackendProvider(): BackendProvider {
  const override = readProviderOverride();
  if (override === 'local') return 'local';
  if (override === 'strada-api' && getStradaApiUrl()) return 'strada-api';
  if (override === 'supabase' && isSupabaseConfigured()) return 'supabase';
  if (getStradaApiUrl()) return 'strada-api';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
}

export function isRemoteBackendConfigured(): boolean {
  return getBackendProvider() !== 'local';
}

export function getBackendLabel(): string {
  const p = getBackendProvider();
  if (p === 'strada-api') return 'Strada API';
  if (p === 'supabase') return 'Supabase (transitorio)';
  return 'Local';
}

export function getSupabaseCredentials() {
  return { url: getSupabaseUrl(), anonKey: getSupabaseAnonKey() };
}

/** Auth propia Strada cuando el backend activo es la API v1. */
export function shouldUseStradaAuth(): boolean {
  return getBackendProvider() === 'strada-api';
}
