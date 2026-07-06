import { normalizeEmail } from '../email';
import { normalizeDisplayNameKey } from '../security/displayName';
import { tryGetSupabase } from './client';
import { profileFromRow } from './mappers';

export async function fetchAvatarUrlsByEmails(emails: string[]): Promise<Record<string, string>> {
  const sb = tryGetSupabase();
  if (!sb || !emails.length) return {};
  const normalized = [...new Set(emails.map((e) => normalizeEmail(e)))];
  const { data, error } = await sb
    .from('profiles')
    .select('email, avatar_url')
    .in('email', normalized);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data) {
    const url = (row as { avatar_url?: string | null }).avatar_url;
    if (url) map[(row as { email: string }).email] = url;
  }
  return map;
}

export async function fetchProfileByUserId(userId: string) {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return profileFromRow(data);
}

export async function fetchProfileByEmail(email: string) {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  if (error || !data) return null;
  return profileFromRow(data);
}

/** Búsqueda segura vía RPC (sin inyección PostgREST). */
export async function searchProfilesSafe(query: string, limit = 15) {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await sb.rpc('search_profiles_safe', {
    search_query: q,
    result_limit: limit,
  });
  if (error || !data) return [];
  return data as { email: string; name: string }[];
}

export async function findProfilesByDisplayName(name: string) {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const trimmed = name.trim();
  if (!trimmed) return [];
  const key = normalizeDisplayNameKey(trimmed);
  const candidates = await searchProfilesSafe(trimmed, 30);
  const exact = candidates.filter((profile) => normalizeDisplayNameKey(profile.name) === key);
  if (exact.length) return exact;
  const { data, error } = await sb.from('profiles').select('email, name').ilike('name', trimmed);
  if (error || !data) return [];
  return (data as { email: string; name: string }[]).filter(
    (profile) => normalizeDisplayNameKey(profile.name) === key,
  );
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    name: string;
    avatarUrl?: string;
    socials: unknown;
    vehicles: unknown;
    vehicleType?: string;
    fuelPref?: string;
  }>,
) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.avatarUrl !== undefined) body.avatar_url = patch.avatarUrl;
  if (patch.socials !== undefined) body.socials = patch.socials;
  if (patch.vehicles !== undefined) body.vehicles = patch.vehicles;
  if (patch.vehicleType !== undefined) body.vehicle_type = patch.vehicleType;
  if (patch.fuelPref !== undefined) body.fuel_pref = patch.fuelPref;
  const { error } = await sb.from('profiles').update(body).eq('id', userId);
  return !error;
}
