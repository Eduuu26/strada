import type { Club, ClubCreationRequest, ClubInvitation } from '../../types';
import type { UserSocials, UserVehicle } from '../../types';
import { normalizeSocials } from '../socials';
import { isFuelPreference, isVehiclePreference } from '../preferences';

type ClubRow = {
  id: string;
  name: string;
  description: string;
  vehicle_mode: string;
  creator_email: string;
  creator_name: string;
  member_emails: string[];
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  created_at: string;
};

type ClubRequestRow = {
  id: string;
  name: string;
  description: string;
  vehicle_mode: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  requester_email: string;
  requester_name: string;
  reviewer_email: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_email: string | null;
  created_club_id: string | null;
  approval_unread: boolean;
};

type ClubInviteRow = {
  id: string;
  club_id: string;
  club_name: string;
  from_email: string;
  from_name: string;
  to_email: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  socials: UserSocials;
  vehicles: UserVehicle[];
  vehicle_type: string | null;
  fuel_pref: string | null;
  created_at: string;
};

export function clubFromRow(row: ClubRow): Club {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    vehicleMode: row.vehicle_mode as Club['vehicleMode'],
    creatorEmail: row.creator_email,
    creatorName: row.creator_name,
    memberEmails: row.member_emails ?? [],
    createdAt: row.created_at,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    locationLabel: row.location_label ?? undefined,
  };
}

export function clubToRow(club: Club) {
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    vehicle_mode: club.vehicleMode ?? 'mixto',
    creator_email: club.creatorEmail,
    creator_name: club.creatorName,
    member_emails: club.memberEmails,
    latitude: club.latitude ?? null,
    longitude: club.longitude ?? null,
    location_label: club.locationLabel ?? null,
    created_at: club.createdAt,
  };
}

export function clubRequestFromRow(row: ClubRequestRow): ClubCreationRequest {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    vehicleMode: row.vehicle_mode as ClubCreationRequest['vehicleMode'],
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    locationLabel: row.location_label ?? undefined,
    requesterEmail: row.requester_email,
    requesterName: row.requester_name,
    reviewerEmail: row.reviewer_email ?? undefined,
    status: row.status as ClubCreationRequest['status'],
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedByEmail: row.reviewed_by_email ?? undefined,
    createdClubId: row.created_club_id ?? undefined,
    approvalUnread: row.approval_unread,
  };
}

export function clubRequestToRow(req: ClubCreationRequest) {
  return {
    id: req.id,
    name: req.name,
    description: req.description,
    vehicle_mode: req.vehicleMode ?? 'mixto',
    latitude: req.latitude ?? null,
    longitude: req.longitude ?? null,
    location_label: req.locationLabel ?? null,
    requester_email: req.requesterEmail,
    requester_name: req.requesterName,
    reviewer_email: req.reviewerEmail ?? null,
    status: req.status,
    created_at: req.createdAt,
    reviewed_at: req.reviewedAt ?? null,
    reviewed_by_email: req.reviewedByEmail ?? null,
    created_club_id: req.createdClubId ?? null,
    approval_unread: req.approvalUnread ?? false,
  };
}

export function clubInviteFromRow(row: ClubInviteRow): ClubInvitation {
  return {
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmail: row.to_email,
    status: row.status as ClubInvitation['status'],
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

export function clubInviteToRow(inv: ClubInvitation) {
  return {
    id: inv.id,
    club_id: inv.clubId,
    club_name: inv.clubName,
    from_email: inv.fromEmail,
    from_name: inv.fromName,
    to_email: inv.toEmail,
    status: inv.status,
    created_at: inv.createdAt,
    reviewed_at: inv.reviewedAt ?? null,
  };
}

export function profileFromRow(row: ProfileRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url ?? undefined,
    socials: normalizeSocials(row.socials),
    vehicles: row.vehicles ?? [],
    vehicleType: isVehiclePreference(row.vehicle_type) ? row.vehicle_type : undefined,
    fuelPref: isFuelPreference(row.fuel_pref) ? row.fuel_pref : undefined,
  };
}
