import { normalizeEmail } from '../email';
import { getSeedPublicProfile } from '../../data/seedProfiles';
import { getBackendProvider } from './config';
import { stradaApiFetch } from './httpClient';
import { fetchProfileByEmail } from '../supabase/profileRepository';
import type { UserSocials, UserVehicle } from '../../types';

export type PublicProfileData = {
  email: string;
  name: string;
  avatarUrl?: string;
  vehicles: UserVehicle[];
  socials?: UserSocials;
};

export async function fetchPublicProfile(email: string): Promise<PublicProfileData | null> {
  const key = normalizeEmail(email);

  if (getBackendProvider() === 'strada-api') {
    const res = await stradaApiFetch<PublicProfileData>(`/api/v1/profiles/${encodeURIComponent(key)}`, {
      auth: false,
    });
    if (res.ok && res.data?.email) return { ...res.data, email: key };
  }

  if (getBackendProvider() === 'supabase' || getBackendProvider() === 'strada-api') {
    const remote = await fetchProfileByEmail(key);
    if (remote) {
      return {
        email: remote.email,
        name: remote.name,
        avatarUrl: remote.avatarUrl,
        vehicles: remote.vehicles ?? [],
        socials: remote.socials,
      };
    }
  }

  const seed = getSeedPublicProfile(key);
  if (seed) {
    return {
      email: seed.email,
      name: seed.name,
      avatarUrl: seed.avatarUrl,
      vehicles: seed.vehicles,
      socials: seed.socials,
    };
  }

  return null;
}
