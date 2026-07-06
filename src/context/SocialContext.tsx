import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { normalizeEmail } from '../lib/email';
import {
  areFriends,
  getFollowers,
  getFollowing,
  getFriends,
  getPendingIncomingRequests,
  getPendingOutgoingRequest,
  hasPendingFriendRequest,
  isFollowing,
  loadFollows,
  loadFriendRequests,
  saveFollows,
  saveFriendRequests,
} from '../lib/social/storage';
import { pullSocialGraph, syncSocialAfterMutation } from '../lib/backend/socialSync';
import type { FriendRequest, ProfileConnectionStatus } from '../types';
import { useAuth } from './AuthContext';

type SocialContextValue = {
  refresh: () => void;
  getConnectionStatus: (targetEmail: string) => ProfileConnectionStatus;
  follow: (targetEmail: string) => void;
  unfollow: (targetEmail: string) => void;
  sendFriendRequest: (targetEmail: string, targetName: string) => { ok: true } | { ok: false; error: string };
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  cancelFriendRequest: (targetEmail: string) => void;
  getPendingRequestCount: () => number;
  getConnectionLabel: (targetEmail: string) => string | null;
  getFollowerCount: (email: string) => number;
  getFollowingCount: (email: string) => number;
  getFriendCount: (email: string) => number;
  getPendingRequests: () => FriendRequest[];
  getIncomingRequestFrom: (fromEmail: string) => FriendRequest | undefined;
  getFriendsList: (email: string) => string[];
  getFollowersList: (email: string) => string[];
  getFollowingList: (email: string) => string[];
};

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [follows, setFollows] = useState<Awaited<ReturnType<typeof loadFollows>>>([]);
  const [friendRequests, setFriendRequests] = useState<Awaited<ReturnType<typeof loadFriendRequests>>>([]);

  const refresh = useCallback(() => {
    void pullSocialGraph().finally(() => {
      void loadFollows().then(setFollows);
      void loadFriendRequests().then(setFriendRequests);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persistSocial = useCallback(
    (nextFollows: typeof follows, nextRequests: typeof friendRequests) => {
      void saveFollows(nextFollows)
        .then(() => saveFriendRequests(nextRequests))
        .then(() => syncSocialAfterMutation(nextFollows, nextRequests));
    },
    [],
  );

  const getConnectionStatus = useCallback(
    (targetEmail: string): ProfileConnectionStatus => {
      if (!user) return 'none';
      const viewer = normalizeEmail(user.email);
      const target = normalizeEmail(targetEmail);
      if (viewer === target) return 'self';
      if (areFriends(friendRequests, viewer, target)) return 'friend';
      if (hasPendingFriendRequest(friendRequests, viewer, target)) return 'request_sent';
      if (hasPendingFriendRequest(friendRequests, target, viewer)) return 'request_received';
      const iFollow = isFollowing(follows, viewer, target);
      const theyFollow = isFollowing(follows, target, viewer);
      if (iFollow && theyFollow) return 'mutual_follow';
      if (iFollow) return 'following';
      if (theyFollow) return 'follower';
      return 'none';
    },
    [user, follows, friendRequests],
  );

  const follow = useCallback(
    (targetEmail: string) => {
      if (!user) return;
      const viewer = normalizeEmail(user.email);
      const target = normalizeEmail(targetEmail);
      if (viewer === target || isFollowing(follows, viewer, target)) return;
      const next = [
        { followerEmail: viewer, followingEmail: target, createdAt: new Date().toISOString() },
        ...follows,
      ];
      setFollows(next);
      persistSocial(next, friendRequests);
    },
    [user, follows, friendRequests, persistSocial],
  );

  const unfollow = useCallback(
    (targetEmail: string) => {
      if (!user) return;
      const viewer = normalizeEmail(user.email);
      const target = normalizeEmail(targetEmail);
      const next = follows.filter(
        (f) =>
          !(
            normalizeEmail(f.followerEmail) === viewer && normalizeEmail(f.followingEmail) === target
          ),
      );
      setFollows(next);
      persistSocial(next, friendRequests);
    },
    [user, follows, friendRequests, persistSocial],
  );

  const sendFriendRequest = useCallback(
    (targetEmail: string, _targetName: string): { ok: true } | { ok: false; error: string } => {
      if (!user) return { ok: false, error: 'Inicia sesión para enviar solicitudes.' };
      const from = normalizeEmail(user.email);
      const to = normalizeEmail(targetEmail);
      if (from === to) return { ok: false, error: 'No puedes enviarte una solicitud a ti mismo.' };
      if (areFriends(friendRequests, from, to)) {
        return { ok: false, error: 'Ya sois amigos.' };
      }
      if (hasPendingFriendRequest(friendRequests, from, to)) {
        return { ok: false, error: 'Ya hay una solicitud pendiente.' };
      }
      const request: FriendRequest = {
        id: `freq_${Date.now()}`,
        fromEmail: from,
        fromName: user.name,
        toEmail: to,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      const next = [request, ...friendRequests];
      setFriendRequests(next);
      persistSocial(follows, next);
      return { ok: true };
    },
    [user, friendRequests, follows, persistSocial],
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) => {
      if (!user) return;
      const accepted = friendRequests.find((r) => r.id === requestId);
      const nextRequests = friendRequests.map((r) =>
        r.id === requestId && r.status === 'pending' && normalizeEmail(r.toEmail) === user.email
          ? { ...r, status: 'accepted' as const, reviewedAt: new Date().toISOString() }
          : r,
      );
      setFriendRequests(nextRequests);
      let nextFollows = follows;
      if (accepted && !isFollowing(follows, user.email, accepted.fromEmail)) {
        nextFollows = [
          {
            followerEmail: normalizeEmail(user.email),
            followingEmail: normalizeEmail(accepted.fromEmail),
            createdAt: new Date().toISOString(),
          },
          ...follows,
        ];
        setFollows(nextFollows);
      }
      persistSocial(nextFollows, nextRequests);
    },
    [user, friendRequests, follows, persistSocial],
  );

  const cancelFriendRequest = useCallback(
    (targetEmail: string) => {
      if (!user) return;
      const from = normalizeEmail(user.email);
      const to = normalizeEmail(targetEmail);
      const next = friendRequests.filter(
        (r) =>
          !(
            r.status === 'pending' &&
            normalizeEmail(r.fromEmail) === from &&
            normalizeEmail(r.toEmail) === to
          ),
      );
      setFriendRequests(next);
      persistSocial(follows, next);
    },
    [user, friendRequests, follows, persistSocial],
  );

  const getConnectionLabel = useCallback(
    (targetEmail: string): string | null => {
      const status = getConnectionStatus(targetEmail);
      switch (status) {
        case 'friend':
          return 'Amigo';
        case 'mutual_follow':
          return 'Os seguís';
        case 'following':
          return 'Siguiendo';
        case 'follower':
          return 'Te sigue';
        case 'request_sent':
          return 'Pendiente';
        case 'request_received':
          return 'Te escribió';
        default:
          return null;
      }
    },
    [getConnectionStatus],
  );

  const rejectFriendRequest = useCallback(
    (requestId: string) => {
      if (!user) return;
      const next = friendRequests.map((r) =>
        r.id === requestId && r.status === 'pending' && normalizeEmail(r.toEmail) === user.email
          ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString() }
          : r,
      );
      setFriendRequests(next);
      persistSocial(follows, next);
    },
    [user, friendRequests, follows, persistSocial],
  );

  const removeFriend = useCallback(
    (friendEmail: string) => {
      if (!user) return;
      const viewer = normalizeEmail(user.email);
      const friend = normalizeEmail(friendEmail);
      const next = friendRequests.map((r) => {
        const isPair =
          (normalizeEmail(r.fromEmail) === viewer && normalizeEmail(r.toEmail) === friend) ||
          (normalizeEmail(r.fromEmail) === friend && normalizeEmail(r.toEmail) === viewer);
        if (!isPair || r.status !== 'accepted') return r;
        return { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString() };
      });
      setFriendRequests(next);
      persistSocial(follows, next);
    },
    [user, friendRequests, follows, persistSocial],
  );

  const value = useMemo(
    () => ({
      refresh,
      getConnectionStatus,
      follow,
      unfollow,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      cancelFriendRequest,
      getPendingRequestCount: () =>
        user ? getPendingIncomingRequests(friendRequests, user.email).length : 0,
      getConnectionLabel,
      getFollowerCount: (email: string) => getFollowers(follows, email).length,
      getFollowingCount: (email: string) => getFollowing(follows, email).length,
      getFriendCount: (email: string) => getFriends(friendRequests, email).length,
      getPendingRequests: () => (user ? getPendingIncomingRequests(friendRequests, user.email) : []),
      getIncomingRequestFrom: (fromEmail: string) => {
        if (!user) return undefined;
        const from = normalizeEmail(fromEmail);
        return getPendingIncomingRequests(friendRequests, user.email).find(
          (r) => normalizeEmail(r.fromEmail) === from,
        );
      },
      getFriendsList: (email: string) => getFriends(friendRequests, email),
      getFollowersList: (email: string) => getFollowers(follows, email),
      getFollowingList: (email: string) => getFollowing(follows, email),
    }),
    [
      refresh,
      getConnectionStatus,
      follow,
      unfollow,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      cancelFriendRequest,
      getConnectionLabel,
      follows,
      friendRequests,
      user,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial(): SocialContextValue {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial debe usarse dentro de SocialProvider');
  return ctx;
}
