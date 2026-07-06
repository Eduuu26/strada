import type { UserSocials } from '../types';

export const SOCIAL_NETWORKS = [
  { id: 'instagram' as const, label: 'Instagram', placeholder: 'usuario', prefix: '@' },
  { id: 'tiktok' as const, label: 'TikTok', placeholder: 'usuario', prefix: '@' },
  { id: 'x' as const, label: 'X', placeholder: 'usuario', prefix: '@' },
  { id: 'youtube' as const, label: 'YouTube', placeholder: 'usuario o URL', prefix: '' },
];

export function emptySocials(): UserSocials {
  return { instagram: '', tiktok: '', x: '', youtube: '' };
}

export function normalizeSocials(socials?: Partial<UserSocials>): UserSocials {
  const base = emptySocials();
  if (!socials) return base;
  SOCIAL_NETWORKS.forEach((n) => {
    base[n.id] = (socials[n.id] || '').trim();
  });
  return base;
}

export function socialProfileUrl(network: keyof UserSocials, handle: string): string | null {
  const h = (handle || '').trim().replace(/^@/, '');
  if (!h) return null;
  if (network === 'instagram') return `https://instagram.com/${h}`;
  if (network === 'tiktok') return `https://tiktok.com/@${h}`;
  if (network === 'x') return `https://x.com/${h}`;
  if (network === 'youtube') return h.startsWith('http') ? h : `https://youtube.com/@${h}`;
  return null;
}

export function formatSocialDisplay(network: keyof UserSocials, handle: string): string {
  const h = (handle || '').trim();
  if (!h) return '';
  const net = SOCIAL_NETWORKS.find((n) => n.id === network);
  if (!h.startsWith('@') && net?.prefix === '@') return `@${h.replace(/^@/, '')}`;
  return h;
}
