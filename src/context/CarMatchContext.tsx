import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SEED_CAR_MATCH_CARDS } from '../data/carMatchSeed';
import { vehicleDisplayTitle, vehiclePhotoUrl } from '../data/vehicles';
import { normalizeEmail } from '../lib/email';
import { isBackendConfigured } from '../lib/env';
import {
  hasExistingLike,
  loadLikes,
  loadSwipes,
  shuffleDeck,
  filterDeck,
  clearSwipes,
  markLikeRead,
  markAllLikesReadForUser,
} from '../lib/carMatch/storage';
import { pullMatchState, recordMatchLike, recordMatchSwipe } from '../lib/backend/matchSync';
import { fetchMatchDiscoveryCards } from '../lib/backend/matchDiscovery';
import { trackEvent } from '../lib/analytics';
import { notifyCarLiked } from '../lib/carMatch/notify';
import type { CarLikeNotification, CarMatchCard, CarSwipeDecision } from '../types';
import { useAuth } from './AuthContext';

type CarMatchContextValue = {
  deck: CarMatchCard[];
  currentCard: CarMatchCard | undefined;
  nextCard: CarMatchCard | undefined;
  remainingCount: number;
  loading: boolean;
  swipe: (decision: CarSwipeDecision) => void;
  notifications: CarLikeNotification[];
  outgoingLikes: CarLikeNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refreshDeck: () => void;
  resetSwipes: () => void;
};

const CarMatchContext = createContext<CarMatchContextValue | null>(null);

export function CarMatchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deck, setDeck] = useState<CarMatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<CarLikeNotification[]>([]);
  const [outgoingLikes, setOutgoingLikes] = useState<CarLikeNotification[]>([]);

  const loadDeck = useCallback(async () => {
    if (!user) {
      setDeck([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await pullMatchState();
    const swipes = await loadSwipes();
    let pool = [...SEED_CAR_MATCH_CARDS];
    if (isBackendConfigured()) {
      const remote = await fetchMatchDiscoveryCards(user.email);
      if (remote.length) pool = [...remote, ...pool];
    }
    const seen = new Set<string>();
    pool = pool.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    setDeck(shuffleDeck(filterDeck(pool, user.email, swipes)));
    setLoading(false);
  }, [user]);

  const refreshDeck = useCallback(() => {
    void loadDeck();
  }, [loadDeck]);

  const resetSwipes = useCallback(() => {
    void clearSwipes().then(loadDeck);
  }, [loadDeck]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setOutgoingLikes([]);
      return;
    }
    const all = await loadLikes();
    const email = user.email.toLowerCase();
    setNotifications(all.filter((n) => n.toEmail.toLowerCase() === email));
    setOutgoingLikes(all.filter((n) => n.fromEmail.toLowerCase() === email));
  }, [user]);

  useEffect(() => {
    refreshDeck();
    void refreshNotifications();
  }, [refreshDeck, refreshNotifications]);

  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const n of notifications) {
      if (n.read || notifiedIds.current.has(n.id)) continue;
      notifiedIds.current.add(n.id);
      void notifyCarLiked(n.fromName, n.vehicleLabel);
    }
  }, [notifications]);

  const swipe = useCallback(
    (decision: CarSwipeDecision) => {
      if (!user || !deck.length) return;
      const card = deck[0];

      void (async () => {
        await recordMatchSwipe(card.id, decision);

        if (decision === 'like') {
          const likes = await loadLikes();
          if (!hasExistingLike(likes, user.email, card.ownerEmail, card.vehicle.id)) {
            const like: CarLikeNotification = {
              id: `like_${Date.now()}`,
              fromEmail: user.email,
              fromName: user.name,
              toEmail: card.ownerEmail,
              vehicleId: card.vehicle.id,
              vehicleLabel: vehicleDisplayTitle(card.vehicle),
              vehiclePhotoUrl: vehiclePhotoUrl(card.vehicle),
              createdAt: new Date().toISOString(),
              read: false,
            };
            await recordMatchLike(like);
            trackEvent('match_like', { vehicleId: card.vehicle.id });
          }
        }

        setDeck((prev) => prev.slice(1));
        void refreshNotifications();
      })();
    },
    [user, deck, refreshNotifications],
  );

  const markRead = useCallback(
    (id: string) => {
      void markLikeRead(id).then(refreshNotifications);
    },
    [refreshNotifications],
  );

  const markAllRead = useCallback(() => {
    if (!user) return;
    void markAllLikesReadForUser(user.email).then(refreshNotifications);
  }, [user, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      deck,
      currentCard: deck[0],
      nextCard: deck[1],
      remainingCount: deck.length,
      loading,
      swipe,
      notifications,
      outgoingLikes,
      unreadCount,
      markRead,
      markAllRead,
      refreshDeck,
      resetSwipes,
    }),
    [
      deck,
      loading,
      swipe,
      notifications,
      outgoingLikes,
      unreadCount,
      markRead,
      markAllRead,
      refreshDeck,
      resetSwipes,
    ],
  );

  return <CarMatchContext.Provider value={value}>{children}</CarMatchContext.Provider>;
}

export function useCarMatch(): CarMatchContextValue {
  const ctx = useContext(CarMatchContext);
  if (!ctx) throw new Error('useCarMatch debe usarse dentro de CarMatchProvider');
  return ctx;
}
