import type { Club, ClubCreationRequest, ClubInvitation } from '../../types';
import { tryGetSupabase } from './client';
import {
  clubFromRow,
  clubInviteFromRow,
  clubInviteToRow,
  clubRequestFromRow,
  clubRequestToRow,
  clubToRow,
} from './mappers';

export async function fetchAllClubsData(): Promise<{
  clubs: Club[];
  invitations: ClubInvitation[];
  clubCreationRequests: ClubCreationRequest[];
}> {
  const sb = tryGetSupabase();
  if (!sb) return { clubs: [], invitations: [], clubCreationRequests: [] };

  const [clubsRes, invitesRes, requestsRes] = await Promise.all([
    sb.from('clubs').select('*').order('created_at', { ascending: false }),
    sb.from('club_invitations').select('*').order('created_at', { ascending: false }),
    sb.from('club_creation_requests').select('*').order('created_at', { ascending: false }),
  ]);

  return {
    clubs: (clubsRes.data ?? []).map(clubFromRow),
    invitations: (invitesRes.data ?? []).map(clubInviteFromRow),
    clubCreationRequests: (requestsRes.data ?? []).map(clubRequestFromRow),
  };
}

export async function upsertClub(club: Club) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('clubs').upsert(clubToRow(club));
  return !error;
}

export async function deleteClubById(clubId: string) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('clubs').delete().eq('id', clubId);
  return !error;
}

export async function upsertClubRequest(request: ClubCreationRequest) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('club_creation_requests').upsert(clubRequestToRow(request));
  return !error;
}

export async function deleteClubRequestById(requestId: string) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('club_creation_requests').delete().eq('id', requestId);
  return !error;
}

export async function upsertClubInvitation(invitation: ClubInvitation) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('club_invitations').upsert(clubInviteToRow(invitation));
  return !error;
}

export async function deleteClubInvitesForClub(clubId: string) {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('club_invitations').delete().eq('club_id', clubId);
  return !error;
}
