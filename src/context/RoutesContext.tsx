import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedRoutes as defaultRoutes } from '../data/seed';
import { canReviewJoinRequest, isOpenJoin } from '../lib/joinAccess';
import { isSupabaseConfigured } from '../lib/env';
import {
  deleteSignupById,
  fetchAllRoutesData,
  upsertJoinRequest,
  upsertMeetup,
  upsertRoute,
  upsertSignup,
} from '../lib/supabase/routesRepository';
import { vehicleMatchesRoute } from '../lib/routeVehicles';
import type {
  CreateMeetupInput,
  CreateRouteInput,
  DrivingRoute,
  JoinRequest,
  Meetup,
  RouteSignup,
} from '../types';

export type ChatSyncApi = {
  ensureMeetupChat: (meetup: Meetup) => void;
  ensureRouteChat: (route: { id: string; title: string; creatorEmail?: string }) => void;
  syncMeetupParticipant: (meetup: Meetup, email: string, userName: string, joined: boolean) => void;
  syncRouteParticipant: (
    route: { id: string; title: string; creatorEmail?: string },
    email: string,
    userName: string,
    joined: boolean,
  ) => void;
};

type RoutesContextValue = {
  routes: DrivingRoute[];
  meetups: Meetup[];
  signups: RouteSignup[];
  joinRequests: JoinRequest[];
  getRoute: (id: string) => DrivingRoute | undefined;
  getMeetup: (id: string) => Meetup | undefined;
  getSignupsForRoute: (routeId: string) => RouteSignup[];
  getSignupsForMeetup: (meetupId: string) => RouteSignup[];
  getPendingRequestsForMeetup: (meetupId: string) => JoinRequest[];
  getPendingRequestsForRoute: (routeId: string) => JoinRequest[];
  getUserPendingRequest: (
    target: { meetupId?: string; routeId?: string },
    email: string,
  ) => JoinRequest | undefined;
  isUserSignedUp: (routeId: string, email: string) => boolean;
  isUserSignedUpToMeetup: (meetupId: string, email: string) => boolean;
  createRoute: (input: CreateRouteInput, creator: { email: string; name: string }) => DrivingRoute;
  createMeetup: (input: CreateMeetupInput, creator: { email: string; name: string }) => Meetup;
  joinRoute: (
    routeId: string,
    user: { email: string; name: string },
    vehicle: { type: RouteSignup['vehicleType']; label: string },
  ) => void;
  joinMeetup: (
    meetupId: string,
    user: { email: string; name: string },
    vehicle: { type: RouteSignup['vehicleType']; label: string },
  ) => void;
  requestJoinRoute: (
    routeId: string,
    user: { email: string; name: string },
    vehicle: { type: RouteSignup['vehicleType']; label: string },
  ) => void;
  requestJoinMeetup: (
    meetupId: string,
    user: { email: string; name: string },
    vehicle: { type: RouteSignup['vehicleType']; label: string },
  ) => void;
  approveJoinRequest: (requestId: string, reviewerEmail: string) => boolean;
  rejectJoinRequest: (requestId: string, reviewerEmail: string) => boolean;
  cancelJoinRequest: (requestId: string, userEmail: string) => void;
  leaveRoute: (routeId: string, email: string) => void;
  leaveMeetup: (meetupId: string, email: string) => void;
};

const RoutesContext = createContext<RoutesContextValue | null>(null);

function buildSeedMeetups(): Meetup[] {
  return [
    {
      id: 'meetup_seed_madrid',
      title: 'Salida dominical — Sierra de Madrid',
      description: 'Quedada en La Moraleja para subir a Navacerrada. Ritmo tranquilo, parada en Miraflores.',
      routeId: 'sierra-madrid',
      meetingAt: '2026-07-12T09:00:00+02:00',
      meetingPoint: 'Gasolinera La Moraleja (A-1)',
      meetingLat: 40.5186,
      meetingLng: -3.8267,
      maxAttendees: 20,
      vehicleMode: 'mixto',
      joinMode: 'open',
      creatorName: 'Laura M.',
      creatorEmail: 'laura@strada.es',
      createdAt: '2026-06-01T10:00:00+02:00',
      isSeed: true,
    },
    {
      id: 'meetup_seed_tramuntana',
      title: 'Mallorca — Sa Calobra en moto',
      description: 'Salida madrugadora desde el puerto de Sóller. Solo motos, grupo reducido.',
      routeId: 'tramuntana-moto',
      meetingAt: '2026-09-06T07:00:00+02:00',
      meetingPoint: 'Puerto de Sóller',
      meetingLat: 39.7961,
      meetingLng: 2.6956,
      maxAttendees: 14,
      vehicleMode: 'motos',
      joinMode: 'open',
      creatorName: 'Pedro L.',
      creatorEmail: 'pedro@strada.es',
      createdAt: '2026-06-05T12:00:00+02:00',
      isSeed: true,
    },
    {
      id: 'meetup_seed_n260',
      title: 'N-260 · Pirineo en moto (privada)',
      description: 'Grupo cerrado por solicitud. Curvas infinitas por el Pirineo aragonés.',
      routeId: 'n260-moto',
      meetingAt: '2026-08-16T09:00:00+02:00',
      meetingPoint: 'Plaza de Aínsa',
      meetingLat: 42.4156,
      meetingLng: 0.1401,
      maxAttendees: 12,
      vehicleMode: 'motos',
      joinMode: 'request',
      creatorName: 'Miguel S.',
      creatorEmail: 'miguel@strada.es',
      createdAt: '2026-06-10T12:00:00+02:00',
      isSeed: true,
    },
  ];
}

function parseStops(stopsText: string) {
  return stopsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `stop_${index}`,
      name,
      latitude: 40.4 + index * 0.01,
      longitude: -3.7 - index * 0.01,
    }));
}

export function RoutesProvider({
  children,
  chatSync,
}: {
  children: ReactNode;
  chatSync?: ChatSyncApi;
}) {
  const [customRoutes, setCustomRoutes] = useState<DrivingRoute[]>([]);
  const [customMeetups, setCustomMeetups] = useState<Meetup[]>([]);
  const [signups, setSignups] = useState<RouteSignup[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const supabaseOn = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseOn) return;
    void fetchAllRoutesData().then(({ routes, meetups, signups: s, joinRequests: j }) => {
      setCustomRoutes(routes);
      setCustomMeetups(meetups);
      setSignups(s);
      setJoinRequests(j);
    });
  }, [supabaseOn]);

  const routes = useMemo(() => [...defaultRoutes, ...customRoutes], [customRoutes]);
  const meetups = useMemo(
    () =>
      [...customMeetups, ...buildSeedMeetups()].sort(
        (a, b) => new Date(a.meetingAt).getTime() - new Date(b.meetingAt).getTime(),
      ),
    [customMeetups],
  );

  const getRoute = useCallback(
    (id: string) => routes.find((route) => route.id === id),
    [routes],
  );

  const getMeetup = useCallback((id: string) => meetups.find((m) => m.id === id), [meetups]);

  const getSignupsForRoute = useCallback(
    (routeId: string) => signups.filter((s) => s.routeId === routeId),
    [signups],
  );

  const getSignupsForMeetup = useCallback(
    (meetupId: string) => signups.filter((s) => s.meetupId === meetupId),
    [signups],
  );

  const getPendingRequestsForMeetup = useCallback(
    (meetupId: string) =>
      joinRequests.filter((r) => r.meetupId === meetupId && r.status === 'pending'),
    [joinRequests],
  );

  const getPendingRequestsForRoute = useCallback(
    (routeId: string) =>
      joinRequests.filter((r) => r.routeId === routeId && !r.meetupId && r.status === 'pending'),
    [joinRequests],
  );

  const getUserPendingRequest = useCallback(
    (target: { meetupId?: string; routeId?: string }, email: string) =>
      joinRequests.find(
        (r) =>
          r.status === 'pending' &&
          r.userEmail === email &&
          (target.meetupId ? r.meetupId === target.meetupId : r.routeId === target.routeId),
      ),
    [joinRequests],
  );

  const isUserSignedUp = useCallback(
    (routeId: string, email: string) =>
      signups.some((s) => s.routeId === routeId && s.userEmail === email),
    [signups],
  );

  const isUserSignedUpToMeetup = useCallback(
    (meetupId: string, email: string) =>
      signups.some((s) => s.meetupId === meetupId && s.userEmail === email),
    [signups],
  );

  const createRoute = useCallback(
    (input: CreateRouteInput, creator: { email: string; name: string }) => {
      const route: DrivingRoute = {
        id: `custom_${Date.now()}`,
        title: input.title.trim(),
        region: input.region.trim(),
        province: input.province.trim() || input.region.trim(),
        description: input.description.trim(),
        coverImage: input.coverImage,
        distanceKm: input.distanceKm,
        durationMin: input.durationMin,
        difficulty: input.difficulty,
        vehicleMode: input.vehicleMode,
        tags: ['comunidad'],
        stops: parseStops(input.stopsText),
        creatorEmail: creator.email,
        creatorName: creator.name,
        meetingAt: input.meetingAt,
        meetingPoint: input.meetingPoint.trim(),
        maxAttendees: input.maxAttendees,
        joinMode: input.joinMode,
        isCustom: true,
      };
      setCustomRoutes((prev) => [route, ...prev]);
      if (supabaseOn) void upsertRoute(route);
      if (input.meetingAt) {
        chatSync?.ensureRouteChat(route);
      }
      return route;
    },
    [chatSync, supabaseOn],
  );

  const createMeetup = useCallback(
    (input: CreateMeetupInput, creator: { email: string; name: string }) => {
      const linked = input.routeId ? routes.find((r) => r.id === input.routeId) : undefined;
      const meetup: Meetup = {
        id: `meetup_${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        routeId: input.routeId || undefined,
        meetingAt: input.meetingAt,
        meetingPoint: input.meetingPoint.trim(),
        meetingLat: linked?.meetingLat ?? linked?.stops?.[0]?.latitude ?? 40.4168,
        meetingLng: linked?.meetingLng ?? linked?.stops?.[0]?.longitude ?? -3.7038,
        maxAttendees: input.maxAttendees,
        vehicleMode: input.vehicleMode,
        coverImage: input.coverImage,
        creatorEmail: creator.email,
        creatorName: creator.name,
        joinMode: input.joinMode,
        createdAt: new Date().toISOString(),
      };
      setCustomMeetups((prev) => [meetup, ...prev]);
      if (supabaseOn) void upsertMeetup(meetup);
      chatSync?.ensureMeetupChat(meetup);
      return meetup;
    },
    [routes, chatSync, supabaseOn],
  );

  const joinRoute = useCallback(
    (
      routeId: string,
      user: { email: string; name: string },
      vehicle: { type: RouteSignup['vehicleType']; label: string },
    ) => {
      const route = routes.find((r) => r.id === routeId);
      setSignups((prev) => {
        if (prev.some((s) => s.routeId === routeId && s.userEmail === user.email)) {
          return prev;
        }
        const signup: RouteSignup = {
          id: `signup_${Date.now()}`,
          routeId,
          userEmail: user.email,
          userName: user.name,
          vehicleType: vehicle.type,
          vehicleLabel: vehicle.label.trim(),
          joinedAt: new Date().toISOString(),
        };
        if (supabaseOn) void upsertSignup(signup);
        return [...prev, signup];
      });
      if (route) {
        chatSync?.ensureRouteChat(route);
        chatSync?.syncRouteParticipant(route, user.email, user.name, true);
      }
    },
    [routes, chatSync, supabaseOn],
  );

  const joinMeetup = useCallback(
    (
      meetupId: string,
      user: { email: string; name: string },
      vehicle: { type: RouteSignup['vehicleType']; label: string },
    ) => {
      const target = meetups.find((m) => m.id === meetupId);
      if (target && !vehicleMatchesRoute({ vehicleMode: target.vehicleMode }, vehicle.type)) {
        return;
      }
      setSignups((prev) => {
        if (prev.some((s) => s.meetupId === meetupId && s.userEmail === user.email)) {
          return prev;
        }
        const signup: RouteSignup = {
          id: `signup_${Date.now()}`,
          meetupId,
          routeId: target?.routeId,
          userEmail: user.email,
          userName: user.name,
          vehicleType: vehicle.type,
          vehicleLabel: vehicle.label.trim(),
          joinedAt: new Date().toISOString(),
        };
        if (supabaseOn) void upsertSignup(signup);
        return [...prev, signup];
      });
      if (target) {
        chatSync?.ensureMeetupChat(target);
        chatSync?.syncMeetupParticipant(target, user.email, user.name, true);
      }
    },
    [meetups, chatSync, supabaseOn],
  );

  const requestJoinRoute = useCallback(
    (
      routeId: string,
      user: { email: string; name: string },
      vehicle: { type: RouteSignup['vehicleType']; label: string },
    ) => {
      const route = routes.find((r) => r.id === routeId);
      setJoinRequests((prev) => {
        if (
          prev.some(
            (r) =>
              r.status === 'pending' &&
              r.routeId === routeId &&
              !r.meetupId &&
              r.userEmail === user.email,
          )
        ) {
          return prev;
        }
        const request: JoinRequest = {
          id: `jr_${Date.now()}`,
          routeId,
          userEmail: user.email,
          userName: user.name,
          vehicleType: vehicle.type,
          vehicleLabel: vehicle.label.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        if (supabaseOn) void upsertJoinRequest(request, route?.creatorEmail);
        return [...prev, request];
      });
    },
    [routes, supabaseOn],
  );

  const requestJoinMeetup = useCallback(
    (
      meetupId: string,
      user: { email: string; name: string },
      vehicle: { type: RouteSignup['vehicleType']; label: string },
    ) => {
      const target = meetups.find((m) => m.id === meetupId);
      setJoinRequests((prev) => {
        if (
          prev.some(
            (r) =>
              r.status === 'pending' &&
              r.meetupId === meetupId &&
              r.userEmail === user.email,
          )
        ) {
          return prev;
        }
        const request: JoinRequest = {
          id: `jr_${Date.now()}`,
          meetupId,
          routeId: target?.routeId,
          userEmail: user.email,
          userName: user.name,
          vehicleType: vehicle.type,
          vehicleLabel: vehicle.label.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        if (supabaseOn) void upsertJoinRequest(request, target?.creatorEmail);
        return [...prev, request];
      });
    },
    [meetups, supabaseOn],
  );

  const approveJoinRequest = useCallback(
    (requestId: string, reviewerEmail: string) => {
      const request = joinRequests.find((r) => r.id === requestId);
      if (!request || request.status !== 'pending') return false;
      if (!canReviewJoinRequest(request, routes, meetups, reviewerEmail)) return false;

      const reviewedAt = new Date().toISOString();
      const approved = { ...request, status: 'approved' as const, reviewedAt };
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === requestId ? approved : r)),
      );
      if (supabaseOn) void upsertJoinRequest(approved, undefined);

      if (request.meetupId) {
        joinMeetup(
          request.meetupId,
          { email: request.userEmail, name: request.userName },
          { type: request.vehicleType, label: request.vehicleLabel },
        );
      } else if (request.routeId) {
        joinRoute(
          request.routeId,
          { email: request.userEmail, name: request.userName },
          { type: request.vehicleType, label: request.vehicleLabel },
        );
      }
      return true;
    },
    [joinRequests, routes, meetups, joinMeetup, joinRoute, supabaseOn],
  );

  const rejectJoinRequest = useCallback(
    (requestId: string, reviewerEmail: string) => {
      const request = joinRequests.find((r) => r.id === requestId);
      if (!request || request.status !== 'pending') return false;
      if (!canReviewJoinRequest(request, routes, meetups, reviewerEmail)) return false;
      const rejected = {
        ...request,
        status: 'rejected' as const,
        reviewedAt: new Date().toISOString(),
      };
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === requestId ? rejected : r)),
      );
      if (supabaseOn) void upsertJoinRequest(rejected, undefined);
      return true;
    },
    [joinRequests, routes, meetups, supabaseOn],
  );

  const cancelJoinRequest = useCallback((requestId: string, userEmail: string) => {
    setJoinRequests((prev) =>
      prev.filter((r) => !(r.id === requestId && r.userEmail === userEmail && r.status === 'pending')),
    );
  }, []);

  const leaveRoute = useCallback(
    (routeId: string, email: string) => {
      const route = routes.find((r) => r.id === routeId);
      const signup = signups.find((s) => s.routeId === routeId && s.userEmail === email);
      setSignups((prev) => prev.filter((s) => !(s.routeId === routeId && s.userEmail === email)));
      if (signup && supabaseOn) void deleteSignupById(signup.id);
      if (route && signup) {
        chatSync?.syncRouteParticipant(route, email, signup.userName, false);
      }
    },
    [routes, signups, chatSync, supabaseOn],
  );

  const leaveMeetup = useCallback(
    (meetupId: string, email: string) => {
      const meetup = meetups.find((m) => m.id === meetupId);
      const signup = signups.find((s) => s.meetupId === meetupId && s.userEmail === email);
      setSignups((prev) => prev.filter((s) => !(s.meetupId === meetupId && s.userEmail === email)));
      if (signup && supabaseOn) void deleteSignupById(signup.id);
      if (meetup && signup) {
        chatSync?.syncMeetupParticipant(meetup, email, signup.userName, false);
      }
    },
    [meetups, signups, chatSync, supabaseOn],
  );

  const value = useMemo(
    () => ({
      routes,
      meetups,
      signups,
      joinRequests,
      getRoute,
      getMeetup,
      getSignupsForRoute,
      getSignupsForMeetup,
      getPendingRequestsForMeetup,
      getPendingRequestsForRoute,
      getUserPendingRequest,
      isUserSignedUp,
      isUserSignedUpToMeetup,
      createRoute,
      createMeetup,
      joinRoute,
      joinMeetup,
      requestJoinRoute,
      requestJoinMeetup,
      approveJoinRequest,
      rejectJoinRequest,
      cancelJoinRequest,
      leaveRoute,
      leaveMeetup,
    }),
    [
      routes,
      meetups,
      signups,
      joinRequests,
      getRoute,
      getMeetup,
      getSignupsForRoute,
      getSignupsForMeetup,
      getPendingRequestsForMeetup,
      getPendingRequestsForRoute,
      getUserPendingRequest,
      isUserSignedUp,
      isUserSignedUpToMeetup,
      createRoute,
      createMeetup,
      joinRoute,
      joinMeetup,
      requestJoinRoute,
      requestJoinMeetup,
      approveJoinRequest,
      rejectJoinRequest,
      cancelJoinRequest,
      leaveRoute,
      leaveMeetup,
    ],
  );

  return <RoutesContext.Provider value={value}>{children}</RoutesContext.Provider>;
}

export function useRoutes(): RoutesContextValue {
  const ctx = useContext(RoutesContext);
  if (!ctx) {
    throw new Error('useRoutes debe usarse dentro de RoutesProvider');
  }
  return ctx;
}
