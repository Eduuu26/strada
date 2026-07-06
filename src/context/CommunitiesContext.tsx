import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Linking from 'expo-linking';

import { useAuth } from './AuthContext';
import {
  canManageCommunity,
  isActiveMembership,
  membershipFor,
  validateCreateCommunityInput,
} from '../lib/communities';
import {
  createCommunity as createCommunityRepo,
  deleteCommunity as deleteCommunityRepo,
  fetchCommunities,
  fetchMyMemberships,
  joinCommunity as joinCommunityRepo,
  leaveCommunity as leaveCommunityRepo,
} from '../lib/supabase/communitiesRepository';
import { cancelCommunitySubscription } from '../lib/supabase/accountRepository';
import {
  startCommunityCheckout,
  startStripeOnboarding,
} from '../lib/supabase/billingRepository';
import type { Community, CreateCommunityInput, Membership } from '../types';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
type UrlResult = { ok: true; url: string } | { ok: false; error: string };

type CommunitiesContextValue = {
  communities: Community[];
  myMemberships: Membership[];
  loading: boolean;
  refresh: () => Promise<void>;
  getCommunity: (id: string) => Community | undefined;
  getMyMembership: (communityId: string) => Membership | undefined;
  isActiveMember: (communityId: string) => boolean;
  canManage: (community: Community) => boolean;
  createCommunity: (input: CreateCommunityInput) => Promise<Result<Community>>;
  joinCommunity: (communityId: string) => Promise<Result<Membership>>;
  leaveCommunity: (communityId: string) => Promise<boolean>;
  deleteCommunity: (communityId: string) => Promise<boolean>;
  /** Inicia el pago de una comunidad de pago; devuelve URL de Checkout. */
  subscribe: (communityId: string) => Promise<UrlResult>;
  /** Onboarding de Stripe Connect para el owner; devuelve URL. */
  connectStripe: (communityId: string) => Promise<UrlResult>;
};

const CommunitiesContext = createContext<CommunitiesContextValue | null>(null);

export function CommunitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCommunities([]);
      setMyMemberships([]);
      return;
    }
    setLoading(true);
    try {
      const [list, memberships] = await Promise.all([
        fetchCommunities(),
        fetchMyMemberships(userId),
      ]);
      setCommunities(list);
      setMyMemberships(memberships);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getCommunity = useCallback(
    (id: string) => communities.find((c) => c.id === id),
    [communities],
  );

  const getMyMembership = useCallback(
    (communityId: string) => (userId ? membershipFor(myMemberships, userId, communityId) : undefined),
    [myMemberships, userId],
  );

  const isActiveMember = useCallback(
    (communityId: string) => isActiveMembership(getMyMembership(communityId)),
    [getMyMembership],
  );

  const canManage = useCallback(
    (community: Community) => canManageCommunity(community, getMyMembership(community.id), userId),
    [getMyMembership, userId],
  );

  const createCommunity = useCallback(
    async (input: CreateCommunityInput): Promise<Result<Community>> => {
      if (!userId) return { ok: false, error: 'Inicia sesión para crear una comunidad.' };
      const validation = validateCreateCommunityInput(input);
      if (!validation.ok) return { ok: false, error: validation.error };
      const res = await createCommunityRepo(userId, validation.value);
      if (!res.ok) return { ok: false, error: res.error };
      await refresh();
      return { ok: true, value: res.community };
    },
    [userId, refresh],
  );

  const joinCommunity = useCallback(
    async (communityId: string): Promise<Result<Membership>> => {
      if (!userId) return { ok: false, error: 'Inicia sesión para unirte.' };
      const res = await joinCommunityRepo(userId, communityId);
      if (!res.ok) return { ok: false, error: res.error };
      await refresh();
      return { ok: true, value: res.membership };
    },
    [userId, refresh],
  );

  const leaveCommunity = useCallback(
    async (communityId: string) => {
      if (!userId) return false;
      try {
        await cancelCommunitySubscription(communityId);
      } catch {
        // Continuar con la baja aunque falle Stripe (usuario puede contactar soporte)
      }
      const ok = await leaveCommunityRepo(userId, communityId);
      if (ok) await refresh();
      return ok;
    },
    [userId, refresh],
  );

  const deleteCommunity = useCallback(
    async (communityId: string) => {
      const ok = await deleteCommunityRepo(communityId);
      if (ok) await refresh();
      return ok;
    },
    [refresh],
  );

  const subscribe = useCallback((communityId: string) => {
    const base = Linking.createURL(`/community/${communityId}`);
    return startCommunityCheckout(communityId, {
      successUrl: `${base}?checkout=success`,
      cancelUrl: `${base}?checkout=cancel`,
    });
  }, []);

  const connectStripe = useCallback((communityId: string) => {
    const base = Linking.createURL(`/community/${communityId}`);
    return startStripeOnboarding(communityId, {
      returnUrl: `${base}?stripe=connected`,
      refreshUrl: `${base}?stripe=refresh`,
    });
  }, []);

  const value = useMemo(
    () => ({
      communities,
      myMemberships,
      loading,
      refresh,
      getCommunity,
      getMyMembership,
      isActiveMember,
      canManage,
      createCommunity,
      joinCommunity,
      leaveCommunity,
      deleteCommunity,
      subscribe,
      connectStripe,
    }),
    [
      communities,
      myMemberships,
      loading,
      refresh,
      getCommunity,
      getMyMembership,
      isActiveMember,
      canManage,
      createCommunity,
      joinCommunity,
      leaveCommunity,
      deleteCommunity,
      subscribe,
      connectStripe,
    ],
  );

  return <CommunitiesContext.Provider value={value}>{children}</CommunitiesContext.Provider>;
}

export function useCommunities(): CommunitiesContextValue {
  const ctx = useContext(CommunitiesContext);
  if (!ctx) throw new Error('useCommunities debe usarse dentro de CommunitiesProvider');
  return ctx;
}
