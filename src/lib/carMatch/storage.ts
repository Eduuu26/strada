import type { CarLikeNotification, CarMatchCard, CarSwipeDecision, User } from '../../types';
import { readAppStorage, writeAppStorage } from '../persistentStorage';

export const CAR_MATCH_LIKES_KEY = 'car_match_likes';
export const CAR_MATCH_SWIPES_KEY = 'car_match_swipes';

function cardKey(ownerEmail: string, vehicleId: string): string {
  return `${ownerEmail.toLowerCase()}|${vehicleId}`;
}

export function buildCarMatchCard(user: Pick<User, 'email' | 'name' | 'avatarUrl' | 'vehicles'>): CarMatchCard[] {
  return (user.vehicles ?? [])
    .filter((v) => v.photoUrl || v.brand)
    .map((vehicle) => ({
      id: cardKey(user.email, vehicle.id),
      ownerEmail: user.email,
      ownerName: user.name,
      ownerAvatarUrl: user.avatarUrl,
      vehicle,
    }));
}

export async function loadSwipes(): Promise<Record<string, CarSwipeDecision>> {
  const raw = readAppStorage(CAR_MATCH_SWIPES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, CarSwipeDecision>;
  } catch {
    return {};
  }
}

export async function saveSwipe(cardId: string, decision: CarSwipeDecision): Promise<void> {
  const swipes = await loadSwipes();
  swipes[cardId] = decision;
  await writeAppStorage(CAR_MATCH_SWIPES_KEY, JSON.stringify(swipes));
}

export async function loadLikes(): Promise<CarLikeNotification[]> {
  const raw = readAppStorage(CAR_MATCH_LIKES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CarLikeNotification[];
  } catch {
    return [];
  }
}

export async function appendLike(like: CarLikeNotification): Promise<void> {
  const likes = await loadLikes();
  likes.unshift(like);
  await writeAppStorage(CAR_MATCH_LIKES_KEY, JSON.stringify(likes.slice(0, 200)));
}

export async function markLikeRead(likeId: string): Promise<void> {
  const likes = await loadLikes();
  const next = likes.map((l) => (l.id === likeId ? { ...l, read: true } : l));
  await writeAppStorage(CAR_MATCH_LIKES_KEY, JSON.stringify(next));
}

export async function markAllLikesReadForUser(email: string): Promise<void> {
  const key = email.toLowerCase();
  const likes = await loadLikes();
  const next = likes.map((l) =>
    l.toEmail.toLowerCase() === key ? { ...l, read: true } : l,
  );
  await writeAppStorage(CAR_MATCH_LIKES_KEY, JSON.stringify(next));
}

export function filterDeck(
  cards: CarMatchCard[],
  viewerEmail: string,
  swipes: Record<string, CarSwipeDecision>,
): CarMatchCard[] {
  const viewer = viewerEmail.toLowerCase();
  return cards.filter((c) => {
    if (c.ownerEmail.toLowerCase() === viewer) return false;
    if (swipes[c.id]) return false;
    return true;
  });
}

/** Baraja el mazo (Fisher-Yates) para variedad entre sesiones. */
export function shuffleDeck(cards: CarMatchCard[]): CarMatchCard[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export async function clearSwipes(): Promise<void> {
  await writeAppStorage(CAR_MATCH_SWIPES_KEY, JSON.stringify({}));
}

export function hasExistingLike(
  likes: CarLikeNotification[],
  fromEmail: string,
  toEmail: string,
  vehicleId: string,
): boolean {
  const from = fromEmail.toLowerCase();
  const to = toEmail.toLowerCase();
  return likes.some(
    (l) =>
      l.fromEmail.toLowerCase() === from &&
      l.toEmail.toLowerCase() === to &&
      l.vehicleId === vehicleId,
  );
}
