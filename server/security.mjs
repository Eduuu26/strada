import { createClient } from '@supabase/supabase-js';
import { verifyStradaAccessToken } from './auth.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'administracion@strada.com').trim().toLowerCase();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function securityConfigOk() {
  if (!IS_PRODUCTION) return { ok: true };
  const missing = [];
  const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const hasStradaAuth = Boolean(process.env.STRADA_JWT_SECRET?.trim());
  if (!hasSupabase && !hasStradaAuth) {
    missing.push('STRADA_JWT_SECRET (o SUPABASE_URL + SUPABASE_ANON_KEY)');
  }
  return { ok: missing.length === 0, missing };
}

export async function verifyBearerToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'Token de sesión requerido' };
  }
  const token = authHeader.slice(7).trim();

  const strada = verifyStradaAccessToken(token);
  if (strada.ok) {
    return { ok: true, user: strada.user, source: 'strada' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (IS_PRODUCTION) {
      return { ok: false, error: strada.error || 'Sesión inválida o expirada' };
    }
    return { ok: true, user: { email: ADMIN_EMAIL, id: 'dev' }, devBypass: true };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user?.email) {
    return { ok: false, error: 'Sesión inválida o expirada' };
  }
  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email.trim().toLowerCase() },
    source: 'supabase',
  };
}

export function isAdminEmail(email) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export function sanitizeEmailSubject(value) {
  return String(value ?? '')
    .replace(/[\r\n]/g, ' ')
    .slice(0, 200);
}

export function validateClubRequestPayload(request) {
  if (!request?.id || !request?.name || !request?.requesterEmail) return false;
  if (String(request.name).length > 120) return false;
  if (String(request.description || '').length > 2000) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(request.requesterEmail))) return false;
  return true;
}
