import type { DrivingRoute, JoinRequest, Meetup, RouteSignup } from '../../types';
import { tryGetSupabase } from './client';

type RouteRow = { id: string; data: DrivingRoute; creator_email: string | null; created_at: string };
type MeetupRow = { id: string; data: Meetup; creator_email: string | null; created_at: string };
type SignupRow = { id: string; data: RouteSignup; user_email: string; created_at: string };
type JoinRequestRow = { id: string; data: JoinRequest; user_email: string; created_at: string };

function routeFromRow(row: RouteRow): DrivingRoute {
  return { ...row.data, id: row.id, creatorEmail: row.data.creatorEmail ?? row.creator_email ?? undefined };
}

function meetupFromRow(row: MeetupRow): Meetup {
  return {
    ...row.data,
    id: row.id,
    creatorEmail: row.data.creatorEmail ?? row.creator_email ?? undefined,
    createdAt: row.data.createdAt ?? row.created_at,
  };
}

function signupFromRow(row: SignupRow): RouteSignup {
  return { ...row.data, id: row.id, joinedAt: row.data.joinedAt ?? row.created_at };
}

function joinRequestFromRow(row: JoinRequestRow): JoinRequest {
  return { ...row.data, id: row.id, createdAt: row.data.createdAt ?? row.created_at };
}

export async function fetchAllRoutesData(): Promise<{
  routes: DrivingRoute[];
  meetups: Meetup[];
  signups: RouteSignup[];
  joinRequests: JoinRequest[];
}> {
  const sb = tryGetSupabase();
  if (!sb) return { routes: [], meetups: [], signups: [], joinRequests: [] };

  const [routesRes, meetupsRes, signupsRes, requestsRes] = await Promise.all([
    sb.from('routes').select('id, data, creator_email, created_at').order('created_at', { ascending: false }),
    sb.from('meetups').select('id, data, creator_email, created_at').order('created_at', { ascending: false }),
    sb.from('signups').select('id, data, user_email, created_at').order('created_at', { ascending: false }),
    sb.from('join_requests').select('id, data, user_email, created_at').order('created_at', { ascending: false }),
  ]);

  return {
    routes: (routesRes.data ?? []).map((r) => routeFromRow(r as RouteRow)),
    meetups: (meetupsRes.data ?? []).map((m) => meetupFromRow(m as MeetupRow)),
    signups: (signupsRes.data ?? []).map((s) => signupFromRow(s as SignupRow)),
    joinRequests: (requestsRes.data ?? []).map((j) => joinRequestFromRow(j as JoinRequestRow)),
  };
}

export async function upsertRoute(route: DrivingRoute): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('routes').upsert({
    id: route.id,
    data: { ...route, isCustom: true },
    creator_email: route.creatorEmail?.toLowerCase() ?? null,
    created_at: new Date().toISOString(),
  });
  return !error;
}

export async function upsertMeetup(meetup: Meetup): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('meetups').upsert({
    id: meetup.id,
    data: meetup,
    creator_email: meetup.creatorEmail?.toLowerCase() ?? null,
    created_at: meetup.createdAt,
  });
  return !error;
}

export async function upsertSignup(signup: RouteSignup): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('signups').upsert({
    id: signup.id,
    data: signup,
    user_email: signup.userEmail.toLowerCase(),
    created_at: signup.joinedAt,
  });
  return !error;
}

export async function deleteSignupById(signupId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('signups').delete().eq('id', signupId);
  return !error;
}

export async function upsertJoinRequest(request: JoinRequest, creatorEmail?: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const data = creatorEmail ? { ...request, creatorEmail } : request;
  const { error } = await sb.from('join_requests').upsert({
    id: request.id,
    data,
    user_email: request.userEmail.toLowerCase(),
    created_at: request.createdAt,
  });
  return !error;
}
