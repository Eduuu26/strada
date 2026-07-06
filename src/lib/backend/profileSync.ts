import type { User } from '../../types';
import { getBackendProvider } from './config';
import { stradaApiFetch } from './httpClient';

export type ProfileSyncPayload = {
  name: string;
  avatarUrl?: string;
  vehicles: User['vehicles'];
  socials?: User['socials'];
};

/** Sincroniza el perfil del usuario con Strada API (best-effort). */
export async function syncOwnProfile(user: Pick<User, 'name' | 'email' | 'avatarUrl' | 'vehicles' | 'socials'>): Promise<boolean> {
  if (getBackendProvider() !== 'strada-api') return false;
  if (!user.name?.trim()) return false;

  const res = await stradaApiFetch<ProfileSyncPayload>('/api/v1/profiles/me', {
    method: 'PUT',
    body: {
      name: user.name,
      avatarUrl: user.avatarUrl,
      vehicles: user.vehicles ?? [],
      socials: user.socials,
    },
  });
  return res.ok;
}
