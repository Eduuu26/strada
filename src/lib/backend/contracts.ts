import type { CarLikeNotification, CarSwipeDecision, FriendRequest, ProfileFollow } from '../../types';

/** Contrato HTTP v1 — implementado hoy en server/; sustituye a Supabase sin cambiar la app. */
export type StradaSocialGraph = {
  follows: ProfileFollow[];
  friendRequests: FriendRequest[];
  updatedAt: string;
};

export type StradaMatchState = {
  likes: CarLikeNotification[];
  swipes: Record<string, CarSwipeDecision>;
  updatedAt: string;
};

export type ContentReportInput = {
  targetEmail: string;
  targetName?: string;
  reason: 'spam' | 'harassment' | 'inappropriate_photo' | 'fake_profile' | 'other';
  details?: string;
  contextType?: 'profile' | 'post' | 'chat' | 'vehicle';
  contextId?: string;
};

export type ContentReportResult = { ok: true } | { ok: false; error: string };

export type PushTokenInput = {
  token: string;
  platform: 'ios' | 'android' | 'web';
};
