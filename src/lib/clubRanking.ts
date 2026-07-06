import { normalizeClubEmail } from './clubs';
import type { Club, ClubInvitation, DrivingRoute, Meetup, RouteChat, RouteSignup } from '../types';

export type ClubRankingMetric = 'overall' | 'members' | 'events' | 'interactions';

export type ClubRankingStats = {
  clubId: string;
  memberCount: number;
  routeCount: number;
  meetupCount: number;
  eventCount: number;
  chatMessages: number;
  acceptedInvites: number;
  memberSignups: number;
  interactionScore: number;
  overallScore: number;
};

export type ClubRankingRow = ClubRankingStats & {
  rank: number;
  club: Club;
};

export type ClubRankingInput = {
  clubs: Club[];
  routes: DrivingRoute[];
  meetups: Meetup[];
  signups: RouteSignup[];
  invitations: ClubInvitation[];
  chats: RouteChat[];
};

function memberSet(club: Club): Set<string> {
  return new Set(club.memberEmails.map(normalizeClubEmail));
}

function isClubMemberEmail(club: Club, email?: string): boolean {
  if (!email) return false;
  return memberSet(club).has(normalizeClubEmail(email));
}

export function computeClubStats(
  club: Club,
  input: Omit<ClubRankingInput, 'clubs'>,
): ClubRankingStats {
  const members = memberSet(club);

  const routeCount = input.routes.filter((r) => isClubMemberEmail(club, r.creatorEmail)).length;
  const meetupCount = input.meetups.filter((m) => isClubMemberEmail(club, m.creatorEmail)).length;
  const eventCount = routeCount + meetupCount;

  const chat = input.chats.find((c) => c.clubId === club.id);
  const chatMessages = chat?.messages.filter((m) => m.type === 'user').length ?? 0;

  const acceptedInvites = input.invitations.filter(
    (inv) => inv.clubId === club.id && inv.status === 'accepted',
  ).length;

  const memberSignups = input.signups.filter((s) => members.has(normalizeClubEmail(s.userEmail))).length;

  const interactionScore =
    chatMessages * 2 + acceptedInvites * 5 + memberSignups * 3 + routeCount * 8 + meetupCount * 10;

  const overallScore = memberCount(club) * 10 + eventCount * 18 + interactionScore;

  return {
    clubId: club.id,
    memberCount: memberCount(club),
    routeCount,
    meetupCount,
    eventCount,
    chatMessages,
    acceptedInvites,
    memberSignups,
    interactionScore,
    overallScore,
  };
}

function memberCount(club: Club): number {
  return club.memberEmails.length;
}

export function scoreForMetric(stats: ClubRankingStats, metric: ClubRankingMetric): number {
  switch (metric) {
    case 'members':
      return stats.memberCount;
    case 'events':
      return stats.eventCount;
    case 'interactions':
      return stats.interactionScore;
    default:
      return stats.overallScore;
  }
}

export function metricLabel(metric: ClubRankingMetric): string {
  switch (metric) {
    case 'members':
      return 'Miembros';
    case 'events':
      return 'Rutas y quedadas';
    case 'interactions':
      return 'Actividad';
    default:
      return 'General';
  }
}

export function formatRankingStat(stats: ClubRankingStats, metric: ClubRankingMetric): string {
  switch (metric) {
    case 'members':
      return `${stats.memberCount} miembros`;
    case 'events':
      return `${stats.routeCount} rutas · ${stats.meetupCount} quedadas`;
    case 'interactions':
      return `${stats.interactionScore} pts actividad`;
    default:
      return `${stats.overallScore} pts`;
  }
}

export function formatRankingDetail(stats: ClubRankingStats, metric: ClubRankingMetric): string {
  if (metric === 'overall') {
    return `${stats.memberCount} miembros · ${stats.eventCount} eventos · ${stats.interactionScore} actividad`;
  }
  if (metric === 'interactions') {
    return `${stats.chatMessages} msgs · ${stats.memberSignups} apuntados · ${stats.acceptedInvites} invitaciones`;
  }
  if (metric === 'events') {
    return `${stats.memberCount} miembros en el club`;
  }
  return stats.routeCount + stats.meetupCount > 0
    ? `${stats.eventCount} rutas/quedadas publicadas`
    : 'Amplía el club para subir en el ranking';
}

export function buildClubRanking(input: ClubRankingInput, metric: ClubRankingMetric): ClubRankingRow[] {
  const rows = input.clubs.map((club) => {
    const stats = computeClubStats(club, input);
    return { club, ...stats };
  });

  rows.sort((a, b) => {
    const diff = scoreForMetric(b, metric) - scoreForMetric(a, metric);
    if (diff !== 0) return diff;
    return a.club.name.localeCompare(b.club.name, 'es');
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getClubRankPosition(
  clubId: string,
  input: ClubRankingInput,
  metric: ClubRankingMetric = 'overall',
): { rank: number; total: number; stats: ClubRankingStats } | null {
  const club = input.clubs.find((c) => c.id === clubId);
  if (!club) return null;
  const ranking = buildClubRanking(input, metric);
  const row = ranking.find((r) => r.clubId === clubId);
  if (!row) return null;
  const stats = computeClubStats(club, input);
  return { rank: row.rank, total: ranking.length, stats };
}

export const CLUB_RANKING_METRICS: { id: ClubRankingMetric; label: string }[] = [
  { id: 'overall', label: 'General' },
  { id: 'members', label: 'Miembros' },
  { id: 'events', label: 'Rutas y quedadas' },
  { id: 'interactions', label: 'Actividad' },
];
