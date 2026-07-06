import { normalizeEmail } from '../email';
import { readAppStorage, writeAppStorage } from '../persistentStorage';
import type { FriendRequest, ProfileFollow } from '../../types';

export const SOCIAL_FOLLOWS_KEY = 'social_follows';
export const SOCIAL_FRIEND_REQUESTS_KEY = 'social_friend_requests';

function norm(email: string): string {
  return normalizeEmail(email);
}

export async function loadFollows(): Promise<ProfileFollow[]> {
  const raw = readAppStorage(SOCIAL_FOLLOWS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProfileFollow[];
  } catch {
    return [];
  }
}

export async function saveFollows(follows: ProfileFollow[]): Promise<void> {
  await writeAppStorage(SOCIAL_FOLLOWS_KEY, JSON.stringify(follows));
}

export async function loadFriendRequests(): Promise<FriendRequest[]> {
  const raw = readAppStorage(SOCIAL_FRIEND_REQUESTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FriendRequest[];
  } catch {
    return [];
  }
}

export async function saveFriendRequests(requests: FriendRequest[]): Promise<void> {
  await writeAppStorage(SOCIAL_FRIEND_REQUESTS_KEY, JSON.stringify(requests));
}

export function isFollowing(follows: ProfileFollow[], viewerEmail: string, targetEmail: string): boolean {
  const viewer = norm(viewerEmail);
  const target = norm(targetEmail);
  return follows.some((f) => norm(f.followerEmail) === viewer && norm(f.followingEmail) === target);
}

export function getFollowers(follows: ProfileFollow[], email: string): string[] {
  const key = norm(email);
  return follows.filter((f) => norm(f.followingEmail) === key).map((f) => norm(f.followerEmail));
}

export function getFollowing(follows: ProfileFollow[], email: string): string[] {
  const key = norm(email);
  return follows.filter((f) => norm(f.followerEmail) === key).map((f) => norm(f.followingEmail));
}

export function areFriends(requests: FriendRequest[], a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return requests.some(
    (r) =>
      r.status === 'accepted' &&
      ((norm(r.fromEmail) === x && norm(r.toEmail) === y) ||
        (norm(r.fromEmail) === y && norm(r.toEmail) === x)),
  );
}

export function getFriends(requests: FriendRequest[], email: string): string[] {
  const key = norm(email);
  const friends = new Set<string>();
  for (const r of requests) {
    if (r.status !== 'accepted') continue;
    if (norm(r.fromEmail) === key) friends.add(norm(r.toEmail));
    if (norm(r.toEmail) === key) friends.add(norm(r.fromEmail));
  }
  return [...friends];
}

export function hasPendingFriendRequest(
  requests: FriendRequest[],
  fromEmail: string,
  toEmail: string,
): boolean {
  const from = norm(fromEmail);
  const to = norm(toEmail);
  return requests.some(
    (r) => r.status === 'pending' && norm(r.fromEmail) === from && norm(r.toEmail) === to,
  );
}

export function getPendingIncomingRequests(requests: FriendRequest[], email: string): FriendRequest[] {
  const key = norm(email);
  return requests.filter((r) => r.status === 'pending' && norm(r.toEmail) === key);
}

export function getPendingOutgoingRequest(
  requests: FriendRequest[],
  fromEmail: string,
  toEmail: string,
): FriendRequest | undefined {
  const from = norm(fromEmail);
  const to = norm(toEmail);
  return requests.find(
    (r) => r.status === 'pending' && norm(r.fromEmail) === from && norm(r.toEmail) === to,
  );
}
