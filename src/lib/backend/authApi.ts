import type { User } from '../../types';
import { stradaApiFetch } from './httpClient';
import type { StradaSession } from './sessionStorage';

export type AuthSessionPayload = {
  user: User;
  token: string;
  expiresAt: string;
};

type AuthApiUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  vehicles?: User['vehicles'];
  socials?: User['socials'];
  vehicleType?: User['vehicleType'];
  fuelPref?: User['fuelPref'];
  createdAt?: string;
};

function toUser(data: AuthApiUser): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    vehicles: data.vehicles ?? [],
    socials: data.socials,
    vehicleType: data.vehicleType,
    fuelPref: data.fuelPref,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

export async function stradaRegister(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true; data: AuthSessionPayload } | { ok: false; error: string }> {
  const res = await stradaApiFetch<{ user: AuthApiUser; token: string; expiresAt: string }>(
    '/api/v1/auth/register',
    { method: 'POST', body: { name, email, password }, auth: false },
  );
  if (!res.ok) return res;
  return { ok: true, data: { user: toUser(res.data.user), token: res.data.token, expiresAt: res.data.expiresAt } };
}

export async function stradaLogin(
  email: string,
  password: string,
): Promise<{ ok: true; data: AuthSessionPayload } | { ok: false; error: string }> {
  const res = await stradaApiFetch<{ user: AuthApiUser; token: string; expiresAt: string }>(
    '/api/v1/auth/login',
    { method: 'POST', body: { email, password }, auth: false },
  );
  if (!res.ok) return res;
  return { ok: true, data: { user: toUser(res.data.user), token: res.data.token, expiresAt: res.data.expiresAt } };
}

export async function stradaFetchMe(): Promise<User | null> {
  const res = await stradaApiFetch<AuthApiUser>('/api/v1/auth/me');
  if (!res.ok) return null;
  return toUser(res.data);
}

export async function stradaUpdatePassword(newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await stradaApiFetch('/api/v1/auth/password', {
    method: 'POST',
    body: { newPassword },
  });
  if (!res.ok) return res;
  return { ok: true };
}

export async function stradaDeleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await stradaApiFetch('/api/v1/auth/me', { method: 'DELETE' });
  if (!res.ok) return res;
  return { ok: true };
}

export async function stradaExportAccount(): Promise<Record<string, unknown>> {
  const res = await stradaApiFetch<Record<string, unknown>>('/api/v1/auth/export');
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

export function sessionFromPayload(payload: AuthSessionPayload): StradaSession {
  return {
    accessToken: payload.token,
    expiresAt: payload.expiresAt,
    email: payload.user.email,
    userId: payload.user.id,
  };
}
