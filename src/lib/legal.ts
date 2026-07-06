/** URLs y versiones de documentos legales (RGPD, LSSI, consumo). */
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { getPrivacyPolicyUrl } from './env';

export { getPrivacyPolicyUrl };

export const LEGAL_VERSION = '2026-06-29';

type LegalExtra = {
  termsUrl?: string;
  legalNoticeUrl?: string;
  cookiePolicyUrl?: string;
  subscriptionTermsUrl?: string;
};

function extra(): LegalExtra {
  return (Constants.expoConfig?.extra ?? {}) as LegalExtra;
}

function docsBaseFromPrivacy(privacyUrl: string): string {
  const i = privacyUrl.lastIndexOf('/');
  return i > 0 ? privacyUrl.slice(0, i + 1) : 'https://strada-app.github.io/docs/';
}

function docUrl(envKey: string, extraKey: keyof LegalExtra, fileName: string): string {
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  const fromExtra = extra()[extraKey]?.trim();
  if (fromExtra) return fromExtra;
  return `${docsBaseFromPrivacy(getPrivacyPolicyUrl())}${fileName}`;
}

export function getTermsUrl(): string {
  return docUrl('EXPO_PUBLIC_TERMS_URL', 'termsUrl', 'terms-of-service.html');
}

export function getLegalNoticeUrl(): string {
  return docUrl('EXPO_PUBLIC_LEGAL_NOTICE_URL', 'legalNoticeUrl', 'aviso-legal.html');
}

export function getCookiePolicyUrl(): string {
  return docUrl('EXPO_PUBLIC_COOKIE_POLICY_URL', 'cookiePolicyUrl', 'cookie-policy.html');
}

export function getSubscriptionTermsUrl(): string {
  return docUrl(
    'EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL',
    'subscriptionTermsUrl',
    'subscription-terms.html',
  );
}

export const LEGAL_COMPANY_NAME = 'LUKACORP SL';
export const LEGAL_CIF = 'B24794836';
export const LEGAL_ADDRESS = 'C/ Manzana 3, 4º Derecha, 28015 Madrid, España';
export const LEGAL_REGISTRY = 'Registro Mercantil de Madrid';
/** Marca comercial de la app operada por LUKACORP SL */
export const LEGAL_BRAND = 'Strada';

export const LEGAL_CONTACT_EMAIL = 'administracion@strada.com';

export const COOKIE_CONSENT_KEY = 'strada_cookie_consent_v1';

/** Convierte rutas relativas (docs/…) en URL absoluta que el navegador pueda abrir. */
export function resolveLegalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://strada-app.github.io${path}`;
}

export function openLegalUrl(url: string): void {
  const resolved = resolveLegalUrl(url);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(resolved, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(resolved);
}
