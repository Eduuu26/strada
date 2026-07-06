import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from './AuthContext';

import {
  clubsNearLocation,
  filterClubCreationRequestsForViewer,
  getAdminPendingClubCreationRequests,

  getUnreadClubApprovalNotifications,
  getUserClubCreationRequests,

  hasPendingClubCreationRequest,

  hasPendingClubInvite,

  isClubCreator,

  isClubMember,

  isSeedClubId,

  mergeWithSeedClubs,

  normalizeClubEmail,

  type ClubWithDistance,

} from '../lib/clubs';

import { isPlatformAdmin, getPlatformAdminEmail } from '../lib/platformAdmin';
import {
  notifyClubRequestApproved,
  notifyClubRequestRejected,
  notifyClubRequestSubmitted,
} from '../lib/clubRequestEmail';

import type { Club, ClubCreationRequest, ClubInvitation, CreateClubInput } from '../types';

import { SEED_CLUBS } from '../data/seedClubs';
import { isSupabaseConfigured } from '../lib/env';
import {
  deleteClubById,
  deleteClubInvitesForClub,
  deleteClubRequestById,
  fetchAllClubsData,
  upsertClub,
  upsertClubInvitation,
  upsertClubRequest,
} from '../lib/supabase/clubsRepository';



export type UserLookup = (email: string) => { email: string; name: string } | undefined;

export type ClubChatSyncApi = {
  ensureClubChat: (club: Club) => void;
  syncClubParticipant: (
    club: Club,
    email: string,
    userName: string,
    joined: boolean,
  ) => void;
  removeClubChat: (clubId: string) => void;
};



type ClubsContextValue = {

  clubs: Club[];

  invitations: ClubInvitation[];

  clubCreationRequests: ClubCreationRequest[];

  getClub: (id: string) => Club | undefined;

  getUserClubs: (email: string) => Club[];

  getPendingInvitationsFor: (email: string) => ClubInvitation[];

  getSentInvitationsForClub: (clubId: string) => ClubInvitation[];

  getNearbyClubs: (
    latitude: number,
    longitude: number,
    userEmail?: string,
    maxKm?: number | null,
  ) => ClubWithDistance[];

  getPendingClubCreationRequestsForAdmin: () => ClubCreationRequest[];

  getUserClubCreationRequests: (email: string) => ClubCreationRequest[];
  getUnreadClubApprovalNotifications: (email: string) => ClubCreationRequest[];
  markClubApprovalSeen: (requestId: string, userEmail: string) => void;

  submitClubCreationRequest: (

    input: CreateClubInput,

    requester: { email: string; name: string },

  ) => { ok: true; request: ClubCreationRequest } | { ok: false; error: string };

  approveClubCreationRequest: (requestId: string, adminEmail: string) => Club | null;

  rejectClubCreationRequest: (requestId: string, adminEmail: string) => boolean;

  sendInvitation: (

    clubId: string,

    from: { email: string; name: string },

    toEmail: string,

  ) => { ok: true } | { ok: false; error: string };

  acceptInvitation: (invitationId: string, user: { email: string; name: string }) => boolean;

  rejectInvitation: (invitationId: string, user: { email: string; name: string }) => boolean;

  deleteClub: (clubId: string, userEmail: string) => boolean;

};



const ClubsContext = createContext<ClubsContextValue | null>(null);



export function ClubsProvider({

  children,

  findUser,

  chatSync,

}: {

  children: ReactNode;

  findUser: UserLookup;

  chatSync?: ClubChatSyncApi;

}) {

  const { user } = useAuth();

  const [clubs, setClubs] = useState<Club[]>(() => (isSupabaseConfigured() ? [] : SEED_CLUBS));

  const [invitations, setInvitations] = useState<ClubInvitation[]>([]);

  const [clubCreationRequests, setClubCreationRequests] = useState<ClubCreationRequest[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetchAllClubsData().then((data) => {
      if (cancelled) return;
      setClubs(data.clubs);
      setInvitations(data.invitations);
      setClubCreationRequests(
        filterClubCreationRequestsForViewer(
          data.clubCreationRequests,
          user?.email,
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) {
      setClubCreationRequests([]);
      return;
    }
    setClubCreationRequests((prev) => filterClubCreationRequestsForViewer(prev, user.email));
  }, [user?.email]);



  const visibleClubs = useMemo(() => mergeWithSeedClubs(clubs), [clubs]);

  const getClub = useCallback((id: string) => visibleClubs.find((c) => c.id === id), [visibleClubs]);



  const getUserClubs = useCallback(

    (email: string) => {

      const key = normalizeClubEmail(email);

      return visibleClubs.filter((c) => c.memberEmails.some((e) => normalizeClubEmail(e) === key));

    },

    [visibleClubs],

  );

  useEffect(() => {
    if (!user?.email || !chatSync) return;
    getUserClubs(user.email).forEach((club) => chatSync.ensureClubChat(club));
  }, [user?.email, clubs, chatSync, getUserClubs]);



  const getPendingInvitationsFor = useCallback(

    (email: string) => {

      const key = normalizeClubEmail(email);

      return invitations.filter(

        (inv) => normalizeClubEmail(inv.toEmail) === key && inv.status === 'pending',

      );

    },

    [invitations],

  );



  const getSentInvitationsForClub = useCallback(

    (clubId: string) => invitations.filter((inv) => inv.clubId === clubId),

    [invitations],

  );



  const getNearbyClubs = useCallback(

    (latitude: number, longitude: number, userEmail?: string, maxKm?: number | null) =>

      clubsNearLocation(visibleClubs, latitude, longitude, {

        excludeMemberEmail: userEmail,

        maxKm,

      }),

    [visibleClubs],

  );



  const getPendingClubCreationRequestsForAdmin = useCallback(

    () => (user?.email ? getAdminPendingClubCreationRequests(clubCreationRequests, user.email) : []),

    [clubCreationRequests, user?.email],

  );



  const getUserClubCreationRequestsFn = useCallback(

    (email: string) => getUserClubCreationRequests(clubCreationRequests, email),

    [clubCreationRequests],

  );



  const getUnreadClubApprovalNotificationsFn = useCallback(

    (email: string) => getUnreadClubApprovalNotifications(clubCreationRequests, email),

    [clubCreationRequests],

  );



  const markClubApprovalSeen = useCallback((requestId: string, userEmail: string) => {

    const key = normalizeClubEmail(userEmail);

    setClubCreationRequests((prev) =>

      prev.filter(

        (r) => !(r.id === requestId && normalizeClubEmail(r.requesterEmail) === key),

      ),

    );

    if (isSupabaseConfigured()) void deleteClubRequestById(requestId);

  }, []);



  const createClubFromInput = useCallback(

    (input: CreateClubInput, creator: { email: string; name: string }) => {

      const club: Club = {

        id: `club_${Date.now()}`,

        name: input.name.trim(),

        description: input.description.trim(),

        vehicleMode: input.vehicleMode,

        creatorEmail: creator.email,

        creatorName: creator.name,

        memberEmails: [creator.email],

        createdAt: new Date().toISOString(),

        latitude: input.latitude,

        longitude: input.longitude,

        locationLabel: input.locationLabel?.trim() || undefined,

      };

      setClubs((prev) => [club, ...prev]);

      if (isSupabaseConfigured()) void upsertClub(club);

      chatSync?.ensureClubChat(club);

      return club;

    },

    [chatSync],

  );



  const submitClubCreationRequest = useCallback(

    (

      input: CreateClubInput,

      requester: { email: string; name: string },

    ): { ok: true; request: ClubCreationRequest } | { ok: false; error: string } => {

      if (!input.name.trim() || !input.description.trim()) {

        return { ok: false, error: 'Completa nombre y descripción del club.' };

      }

      if (hasPendingClubCreationRequest(clubCreationRequests, requester.email)) {

        return { ok: false, error: 'Ya tienes una solicitud de club pendiente de revisión.' };

      }

      const request: ClubCreationRequest = {

        id: `creq_${Date.now()}`,

        name: input.name.trim(),

        description: input.description.trim(),

        vehicleMode: input.vehicleMode,

        latitude: input.latitude,

        longitude: input.longitude,

        locationLabel: input.locationLabel?.trim() || undefined,

        requesterEmail: requester.email,

        requesterName: requester.name,

        status: 'pending',

        createdAt: new Date().toISOString(),

        reviewerEmail: getPlatformAdminEmail(),

      };

      setClubCreationRequests((prev) => [request, ...prev]);

      if (isSupabaseConfigured()) void upsertClubRequest(request);

      void notifyClubRequestSubmitted(request).then((result) => {
        if (!result.ok) console.warn('[Strada email]', result.error);
      });

      return { ok: true, request };

    },

    [clubCreationRequests],

  );



  const approveClubCreationRequest = useCallback(

    (requestId: string, adminEmail: string) => {

      if (!isPlatformAdmin(adminEmail)) return null;

      const request = clubCreationRequests.find((r) => r.id === requestId);

      if (!request || request.status !== 'pending') return null;



      const club = createClubFromInput(

        {

          name: request.name,

          description: request.description,

          vehicleMode: request.vehicleMode ?? 'mixto',

          latitude: request.latitude,

          longitude: request.longitude,

          locationLabel: request.locationLabel,

        },

        { email: request.requesterEmail, name: request.requesterName },

      );



      setClubCreationRequests((prev) =>

        prev.map((r) =>

          r.id === requestId

            ? {

                ...r,

                status: 'approved',

                reviewedAt: new Date().toISOString(),

                reviewedByEmail: adminEmail,

                createdClubId: club.id,

                approvalUnread: true,

              }

            : r,

        ),

      );

      if (isSupabaseConfigured()) {
        void upsertClubRequest({
          ...request,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedByEmail: adminEmail,
          createdClubId: club.id,
          approvalUnread: true,
        });
      }

      void notifyClubRequestApproved(request, club.id).then((result) => {
        if (!result.ok) console.warn('[Strada email]', result.error);
      });

      return club;

    },

    [clubCreationRequests, createClubFromInput],

  );



  const rejectClubCreationRequest = useCallback(

    (requestId: string, adminEmail: string) => {

      if (!isPlatformAdmin(adminEmail)) return false;

      const request = clubCreationRequests.find((r) => r.id === requestId);

      if (!request || request.status !== 'pending') return false;

      setClubCreationRequests((prev) => prev.filter((r) => r.id !== requestId));

      if (isSupabaseConfigured()) void deleteClubRequestById(requestId);

      void notifyClubRequestRejected(request).then((result) => {
        if (!result.ok) console.warn('[Strada email]', result.error);
      });

      return true;

    },

    [clubCreationRequests],

  );



  const sendInvitation = useCallback(

    (

      clubId: string,

      from: { email: string; name: string },

      toEmailRaw: string,

    ): { ok: true } | { ok: false; error: string } => {

      const toEmail = normalizeClubEmail(toEmailRaw);

      if (!toEmail || !toEmail.includes('@')) {

        return { ok: false, error: 'Introduce un correo válido.' };

      }

      const club = visibleClubs.find((c) => c.id === clubId);

      if (!club) return { ok: false, error: 'Club no encontrado.' };

      if (!isClubCreator(club, from.email)) {

        return { ok: false, error: 'Solo el creador del club puede invitar.' };

      }

      if (normalizeClubEmail(from.email) === toEmail) {

        return { ok: false, error: 'No puedes invitarte a ti mismo.' };

      }

      if (isClubMember(club, toEmail)) {

        return { ok: false, error: 'Esa persona ya es miembro del club.' };

      }

      const target = findUser(toEmail);

      if (!target) {

        return { ok: false, error: 'No hay ningún usuario registrado con ese correo en Strada.' };

      }

      if (hasPendingClubInvite(invitations, clubId, toEmail)) {

        return { ok: false, error: 'Ya hay una invitación pendiente para ese usuario.' };

      }

      const invite: ClubInvitation = {

        id: `cinv_${Date.now()}`,

        clubId,

        clubName: club.name,

        fromEmail: from.email,

        fromName: from.name,

        toEmail: target.email,

        status: 'pending',

        createdAt: new Date().toISOString(),

      };

      setInvitations((prev) => [invite, ...prev]);

      if (isSupabaseConfigured()) void upsertClubInvitation(invite);

      return { ok: true };

    },

    [visibleClubs, invitations, findUser],

  );



  const acceptInvitation = useCallback(

    (invitationId: string, user: { email: string; name: string }) => {

      const invite = invitations.find((inv) => inv.id === invitationId);

      if (!invite || invite.status !== 'pending') return false;

      if (normalizeClubEmail(invite.toEmail) !== normalizeClubEmail(user.email)) return false;

      const club = visibleClubs.find((c) => c.id === invite.clubId);

      if (!club) return false;



      setInvitations((prev) =>

        prev.map((inv) =>

          inv.id === invitationId

            ? { ...inv, status: 'accepted', reviewedAt: new Date().toISOString() }

            : inv,

        ),

      );

      setClubs((prev) => {
        const existing = prev.find((c) => c.id === invite.clubId);
        const base = existing ?? club;
        if (isClubMember(base, user.email)) return prev;
        const updated = { ...base, memberEmails: [...base.memberEmails, user.email] };
        if (isSupabaseConfigured()) void upsertClub(updated);
        if (existing) {
          return prev.map((c) => (c.id === invite.clubId ? updated : c));
        }
        return [updated, ...prev];
      });

      if (isSupabaseConfigured()) {
        void upsertClubInvitation({
          ...invite,
          status: 'accepted',
          reviewedAt: new Date().toISOString(),
        });
      }

      const updatedClub = isClubMember(club, user.email)
        ? club
        : { ...club, memberEmails: [...club.memberEmails, user.email] };
      chatSync?.ensureClubChat(updatedClub);
      chatSync?.syncClubParticipant(updatedClub, user.email, user.name, true);

      return true;

    },

    [invitations, visibleClubs, chatSync],

  );



  const rejectInvitation = useCallback(

    (invitationId: string, user: { email: string; name: string }) => {

      const invite = invitations.find((inv) => inv.id === invitationId);

      if (!invite || invite.status !== 'pending') return false;

      if (normalizeClubEmail(invite.toEmail) !== normalizeClubEmail(user.email)) return false;

      setInvitations((prev) =>

        prev.map((inv) =>

          inv.id === invitationId

            ? { ...inv, status: 'rejected', reviewedAt: new Date().toISOString() }

            : inv,

        ),

      );

      if (isSupabaseConfigured()) {
        void upsertClubInvitation({
          ...invite,
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
        });
      }

      return true;

    },

    [invitations],

  );



  const deleteClub = useCallback((clubId: string, userEmail: string) => {

    const club = visibleClubs.find((c) => c.id === clubId);

    if (!club || !isClubCreator(club, userEmail) || isSeedClubId(clubId)) return false;

    setClubs((prev) => prev.filter((c) => c.id !== clubId));

    setInvitations((prev) => prev.filter((inv) => inv.clubId !== clubId));

    if (isSupabaseConfigured()) {
      void deleteClubById(clubId);
      void deleteClubInvitesForClub(clubId);
    }

    chatSync?.removeClubChat(clubId);

    return true;

  }, [visibleClubs, chatSync]);



  const value = useMemo(

    () => ({

      clubs: visibleClubs,

      invitations,

      clubCreationRequests,

      getClub,

      getUserClubs,

      getPendingInvitationsFor,

      getSentInvitationsForClub,

      getNearbyClubs,

      getPendingClubCreationRequestsForAdmin,

      getUserClubCreationRequests: getUserClubCreationRequestsFn,
      getUnreadClubApprovalNotifications: getUnreadClubApprovalNotificationsFn,
      markClubApprovalSeen,

      submitClubCreationRequest,

      approveClubCreationRequest,

      rejectClubCreationRequest,

      sendInvitation,

      acceptInvitation,

      rejectInvitation,

      deleteClub,

    }),

    [

      visibleClubs,

      invitations,

      clubCreationRequests,

      getClub,

      getUserClubs,

      getPendingInvitationsFor,

      getSentInvitationsForClub,

      getNearbyClubs,

      getPendingClubCreationRequestsForAdmin,

      getUserClubCreationRequestsFn,
      getUnreadClubApprovalNotificationsFn,
      markClubApprovalSeen,

      submitClubCreationRequest,

      approveClubCreationRequest,

      rejectClubCreationRequest,

      sendInvitation,

      acceptInvitation,

      rejectInvitation,

      deleteClub,

    ],

  );



  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>;

}



export function useClubs(): ClubsContextValue {

  const ctx = useContext(ClubsContext);

  if (!ctx) {

    throw new Error('useClubs debe usarse dentro de ClubsProvider');

  }

  return ctx;

}


