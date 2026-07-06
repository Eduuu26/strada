import type { FriendRequest, ProfileFollow } from '../../types';
import {
  loadFollows,
  loadFriendRequests,
  saveFollows,
  saveFriendRequests,
} from '../social/storage';
import { getBackendProvider } from './config';
import type { StradaSocialGraph } from './contracts';
import { stradaApiFetch } from './httpClient';

function mergeFollows(local: ProfileFollow[], remote: ProfileFollow[]): ProfileFollow[] {
  const map = new Map<string, ProfileFollow>();
  for (const item of [...remote, ...local]) {
    const key = `${item.followerEmail}|${item.followingEmail}`;
    map.set(key, item);
  }
  return [...map.values()];
}

function mergeFriendRequests(local: FriendRequest[], remote: FriendRequest[]): FriendRequest[] {
  const map = new Map<string, FriendRequest>();
  for (const item of [...remote, ...local]) {
    map.set(item.id, item);
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Descarga el grafo social remoto y lo fusiona con el almacenamiento local. */
export async function pullSocialGraph(): Promise<void> {
  if (getBackendProvider() !== 'strada-api') return;
  const res = await stradaApiFetch<StradaSocialGraph>('/api/v1/social/graph');
  if (!res.ok) return;
  const localFollows = await loadFollows();
  const localRequests = await loadFriendRequests();
  await saveFollows(mergeFollows(localFollows, res.data.follows ?? []));
  await saveFriendRequests(mergeFriendRequests(localRequests, res.data.friendRequests ?? []));
}

/** Sube el estado social local al API Strada (fuente de verdad futura). */
export async function pushSocialGraph(
  follows: ProfileFollow[],
  friendRequests: FriendRequest[],
): Promise<void> {
  if (getBackendProvider() !== 'strada-api') return;
  const payload: StradaSocialGraph = {
    follows,
    friendRequests,
    updatedAt: new Date().toISOString(),
  };
  await stradaApiFetch('/api/v1/social/graph', { method: 'PUT', body: payload });
}

export async function syncSocialAfterMutation(
  follows: ProfileFollow[],
  friendRequests: FriendRequest[],
): Promise<void> {
  await pushSocialGraph(follows, friendRequests);
}
