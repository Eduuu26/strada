import { buildCarMatchCard } from '../carMatch/storage';
import { normalizeEmail } from '../email';
import { getBackendProvider } from './config';
import { stradaApiFetch } from './httpClient';
import type { PublicProfileData } from './profiles';
import { tryGetSupabase } from '../supabase/client';
import { profileFromRow } from '../supabase/mappers';
import type { CarMatchCard } from '../../types';

async function fetchProfilesFromSupabase(excludeEmail: string): Promise<CarMatchCard[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('profiles')
    .select('id, email, name, avatar_url, vehicles, created_at')
    .neq('email', normalizeEmail(excludeEmail))
    .limit(40);
  if (error || !data) return [];
  const cards: CarMatchCard[] = [];
  for (const row of data) {
    const profile = profileFromRow(row as Parameters<typeof profileFromRow>[0]);
    cards.push(...buildCarMatchCard(profile));
  }
  return cards;
}

async function fetchProfilesFromApi(excludeEmail: string): Promise<CarMatchCard[]> {
  const key = normalizeEmail(excludeEmail);
  const res = await stradaApiFetch<PublicProfileData[]>(
    `/api/v1/profiles?exclude=${encodeURIComponent(key)}&limit=40`,
  );
  if (!res.ok || !Array.isArray(res.data)) return [];
  const cards: CarMatchCard[] = [];
  for (const profile of res.data) {
    cards.push(
      ...buildCarMatchCard({
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        vehicles: profile.vehicles ?? [],
      }),
    );
  }
  return cards;
}

/** Perfiles descubribles para el mazo de Match (API → Supabase transitorio). */
export async function fetchMatchDiscoveryCards(excludeEmail: string): Promise<CarMatchCard[]> {
  const provider = getBackendProvider();
  if (provider === 'strada-api') {
    const fromApi = await fetchProfilesFromApi(excludeEmail);
    if (fromApi.length) return fromApi;
  }
  if (provider === 'supabase' || provider === 'strada-api') {
    return fetchProfilesFromSupabase(excludeEmail);
  }
  return [];
}
