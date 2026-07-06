import type { Club, ClubCreationRequest, ClubInvitation } from '../types';
import { SEED_CLUBS } from '../data/seedClubs';
import { isPlatformAdmin } from './platformAdmin';
import { distanceKm, hasGeoLocation, NEARBY_CLUBS_LIMIT, NEARBY_CLUBS_SPAIN_LIMIT } from './geo';

export type ClubWithDistance = Club & { distanceKm: number };

/** Combina clubes del backend con los demo (sin duplicar ids). */
export function mergeWithSeedClubs(clubs: Club[]): Club[] {
  const seen = new Set(clubs.map((c) => c.id));
  const merged = [...clubs];
  for (const seed of SEED_CLUBS) {
    if (!seen.has(seed.id)) merged.push(seed);
  }
  return merged;
}

export function isSeedClubId(id: string): boolean {
  return id.startsWith('club_seed_');
}

export function normalizeClubEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isClubMember(club: Club, email: string): boolean {
  const key = normalizeClubEmail(email);
  return club.memberEmails.some((e) => normalizeClubEmail(e) === key);
}

export function isClubCreator(club: Club, email: string): boolean {
  return normalizeClubEmail(club.creatorEmail) === normalizeClubEmail(email);
}

export function hasPendingClubInvite(
  invitations: ClubInvitation[],
  clubId: string,
  toEmail: string,
): boolean {
  const key = normalizeClubEmail(toEmail);
  return invitations.some(
    (inv) =>
      inv.clubId === clubId &&
      normalizeClubEmail(inv.toEmail) === key &&
      inv.status === 'pending',
  );
}

export function clubsNearLocation(
  clubs: Club[],
  latitude: number,
  longitude: number,
  options?: {
    maxKm?: number | null;
    limit?: number;
    excludeMemberEmail?: string;
  },
): ClubWithDistance[] {
  const maxKm = options?.maxKm === undefined ? null : options.maxKm;
  const limit = options?.limit ?? (maxKm == null ? NEARBY_CLUBS_SPAIN_LIMIT : NEARBY_CLUBS_LIMIT);
  const excludeKey = options?.excludeMemberEmail
    ? normalizeClubEmail(options.excludeMemberEmail)
    : null;

  return clubs
    .filter(hasGeoLocation)
    .filter((club) => {
      if (!excludeKey) return true;
      return !club.memberEmails.some((email) => normalizeClubEmail(email) === excludeKey);
    })
    .map((club) => ({
      ...club,
      distanceKm: distanceKm({ latitude, longitude }, club),
    }))
    .filter((club) => maxKm == null || club.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function hasPendingClubCreationRequest(
  requests: ClubCreationRequest[],
  requesterEmail: string,
): boolean {
  const key = normalizeClubEmail(requesterEmail);
  return requests.some(
    (r) => normalizeClubEmail(r.requesterEmail) === key && r.status === 'pending',
  );
}

export function getPendingClubCreationRequests(requests: ClubCreationRequest[]): ClubCreationRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

/** Solo el administrador de plataforma puede ver solicitudes ajenas. */
export function getAdminPendingClubCreationRequests(
  requests: ClubCreationRequest[],
  viewerEmail: string,
): ClubCreationRequest[] {
  if (!isPlatformAdmin(viewerEmail)) return [];
  return getPendingClubCreationRequests(requests);
}

/** Limita qué solicitudes se guardan en cliente según el usuario conectado. */
export function filterClubCreationRequestsForViewer(
  requests: ClubCreationRequest[],
  viewerEmail?: string,
): ClubCreationRequest[] {
  if (!viewerEmail) return [];
  const retained = requests.filter(isRetainedClubCreationRequest);
  if (isPlatformAdmin(viewerEmail)) return retained;
  const key = normalizeClubEmail(viewerEmail);
  return retained.filter((r) => normalizeClubEmail(r.requesterEmail) === key);
}

export function getUserClubCreationRequests(
  requests: ClubCreationRequest[],
  requesterEmail: string,
): ClubCreationRequest[] {
  const key = normalizeClubEmail(requesterEmail);
  return requests.filter(
    (r) => normalizeClubEmail(r.requesterEmail) === key && r.status === 'pending',
  );
}

/** Solicitudes que aún deben persistir (pendientes o aprobación no leída). */
export function isRetainedClubCreationRequest(request: ClubCreationRequest): boolean {
  if (request.status === 'pending') return true;
  if (request.status === 'approved' && request.approvalUnread) return true;
  return false;
}

export function getUnreadClubApprovalNotifications(
  requests: ClubCreationRequest[],
  requesterEmail: string,
): ClubCreationRequest[] {
  const key = normalizeClubEmail(requesterEmail);
  return requests.filter(
    (r) =>
      normalizeClubEmail(r.requesterEmail) === key &&
      r.status === 'approved' &&
      r.approvalUnread,
  );
}
