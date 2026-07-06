import { getStradaEmailApiFromExtra } from './env';

declare global {
  interface Window {
    STRADA_EMAIL_API?: string;
  }
}

const DEFAULT_EMAIL_API = 'http://127.0.0.1:8788';

/** URL del servidor de email. La autenticación usa JWT de Supabase (nunca claves en el cliente). */
export function getEmailApiBaseUrl(): string {
  const fromExpo = process.env.EXPO_PUBLIC_STRADA_EMAIL_API?.trim();
  if (fromExpo) return fromExpo.replace(/\/$/, '');

  const fromExtra = getStradaEmailApiFromExtra();
  if (fromExtra) return fromExtra.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.STRADA_EMAIL_API?.trim()) {
    return window.STRADA_EMAIL_API.trim().replace(/\/$/, '');
  }

  return DEFAULT_EMAIL_API;
}
