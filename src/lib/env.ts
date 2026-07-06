/** Entorno y URLs de producción (Expo / EAS). */
import Constants from 'expo-constants';
import { isRemoteBackendConfigured } from './backend/config';

type Extra = {
  appEnv?: string;
  privacyPolicyUrl?: string;
  stradaEmailApi?: string;
  eas?: { projectId?: string };
};

function extra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function getAppEnv(): string {
  return extra().appEnv ?? process.env.APP_ENV ?? 'development';
}

export function isProductionApp(): boolean {
  return getAppEnv() === 'production';
}

export function getPrivacyPolicyUrl(): string {
  return (
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
    extra().privacyPolicyUrl ??
    'https://strada-app.github.io/docs/privacy-policy.html'
  );
}

export function getSupabaseUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return url || null;
}

export function getSupabaseAnonKey(): string | null {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return key || null;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Backend remoto configurado (Supabase transitorio o API Strada propia). */
export function isBackendConfigured(): boolean {
  return isRemoteBackendConfigured();
}

export function getStradaApiUrlFromEnv(): string | null {
  const dedicated = process.env.EXPO_PUBLIC_STRADA_API_URL?.trim();
  if (dedicated) return dedicated.replace(/\/$/, '');
  return getStradaEmailApiFromExtra()?.replace(/\/$/, '') ?? null;
}

export function getStradaEmailApiFromExtra(): string | null {
  const fromExtra = extra().stradaEmailApi?.trim();
  return fromExtra || null;
}

export function getMapboxToken(): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN?.trim();
  return token || null;
}

export function isMapsConfigured(): boolean {
  return Boolean(getMapboxToken());
}
