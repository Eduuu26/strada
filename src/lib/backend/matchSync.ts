import type { CarLikeNotification, CarSwipeDecision } from '../../types';
import {
  appendLike,
  CAR_MATCH_LIKES_KEY,
  CAR_MATCH_SWIPES_KEY,
  loadLikes,
  loadSwipes,
  saveSwipe,
} from '../carMatch/storage';
import { writeAppStorage } from '../persistentStorage';
import { getBackendProvider } from './config';
import type { StradaMatchState } from './contracts';
import { stradaApiFetch } from './httpClient';

export async function pullMatchState(): Promise<void> {
  if (getBackendProvider() !== 'strada-api') return;
  const res = await stradaApiFetch<StradaMatchState>('/api/v1/match/state');
  if (!res.ok) return;
  const remoteLikes = res.data.likes ?? [];
  const localLikes = await loadLikes();
  const merged = [...remoteLikes];
  for (const like of localLikes) {
    if (!merged.some((l) => l.id === like.id)) merged.push(like);
  }
  merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await writeAppStorage(CAR_MATCH_LIKES_KEY, JSON.stringify(merged.slice(0, 200)));
  const localSwipes = await loadSwipes();
  const mergedSwipes = { ...res.data.swipes, ...localSwipes };
  await writeAppStorage(CAR_MATCH_SWIPES_KEY, JSON.stringify(mergedSwipes));
}

export async function pushMatchLike(like: CarLikeNotification): Promise<void> {
  if (getBackendProvider() !== 'strada-api') return;
  await stradaApiFetch('/api/v1/match/likes', { method: 'POST', body: { like } });
}

export async function pushMatchSwipe(cardId: string, decision: CarSwipeDecision): Promise<void> {
  if (getBackendProvider() !== 'strada-api') return;
  await stradaApiFetch('/api/v1/match/swipes', { method: 'POST', body: { cardId, decision } });
}

export async function recordMatchSwipe(cardId: string, decision: CarSwipeDecision): Promise<void> {
  await saveSwipe(cardId, decision);
  await pushMatchSwipe(cardId, decision);
}

export async function recordMatchLike(like: CarLikeNotification): Promise<void> {
  await appendLike(like);
  await pushMatchLike(like);
}
