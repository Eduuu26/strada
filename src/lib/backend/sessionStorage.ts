import { readAppStorage, removeAppStorage, writeAppStorage } from '../persistentStorage';

export const STRADA_SESSION_KEY = 'strada_auth_session';

export type StradaSession = {
  accessToken: string;
  expiresAt: string;
  email: string;
  userId: string;
};

export function readStradaSession(): StradaSession | null {
  const raw = readAppStorage(STRADA_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StradaSession;
    if (!session.accessToken || !session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export async function writeStradaSession(session: StradaSession): Promise<void> {
  await writeAppStorage(STRADA_SESSION_KEY, JSON.stringify(session));
}

export async function clearStradaSession(): Promise<void> {
  await removeAppStorage(STRADA_SESSION_KEY);
}

export function isStradaSessionValid(session: StradaSession | null): boolean {
  if (!session?.accessToken) return false;
  return new Date(session.expiresAt).getTime() > Date.now();
}
