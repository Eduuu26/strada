import { normalizeEmail } from '../lib/email';
import type { UserSocials, UserVehicle } from '../types';
import { SEED_CAR_MATCH_CARDS } from './carMatchSeed';

export type SeedPublicProfile = {
  email: string;
  name: string;
  avatarUrl?: string;
  vehicles: UserVehicle[];
  socials?: UserSocials;
};

function buildSeedProfiles(): SeedPublicProfile[] {
  const map = new Map<string, SeedPublicProfile>();

  for (const card of SEED_CAR_MATCH_CARDS) {
    const key = normalizeEmail(card.ownerEmail);
    const existing = map.get(key);
    if (existing) {
      existing.vehicles.push(card.vehicle);
      continue;
    }
    map.set(key, {
      email: card.ownerEmail,
      name: card.ownerName,
      avatarUrl: card.ownerAvatarUrl,
      vehicles: [card.vehicle],
      socials: demoSocials(card.ownerName),
    });
  }

  return [...map.values()];
}

function demoSocials(name: string): UserSocials {
  const handle = name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '_');
  return {
    instagram: handle,
    tiktok: '',
    x: '',
    youtube: '',
  };
}

export const SEED_PUBLIC_PROFILES: SeedPublicProfile[] = buildSeedProfiles();

const profilesByEmail = new Map(
  SEED_PUBLIC_PROFILES.map((profile) => [normalizeEmail(profile.email), profile]),
);

export const SEED_PROFILE_DIRECTORY = SEED_PUBLIC_PROFILES.map((profile) => ({
  email: profile.email,
  name: profile.name,
}));

export function getSeedPublicProfile(email: string): SeedPublicProfile | undefined {
  const profile = profilesByEmail.get(normalizeEmail(email));
  if (!profile) return undefined;
  return {
    ...profile,
    email: normalizeEmail(profile.email),
    vehicles: profile.vehicles.map((vehicle) => ({ ...vehicle })),
    socials: profile.socials ? { ...profile.socials } : undefined,
  };
}

export function getSeedDirectoryEntry(email: string): { email: string; name: string } | undefined {
  const profile = getSeedPublicProfile(email);
  if (!profile) return undefined;
  return { email: profile.email, name: profile.name };
}
