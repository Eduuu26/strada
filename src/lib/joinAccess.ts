import type { DrivingRoute, JoinMode, JoinRequest, Meetup } from '../types';

export function isOpenJoin(mode?: JoinMode): boolean {
  return (mode ?? 'open') === 'open';
}

export function joinModeLabel(mode?: JoinMode): string {
  return mode === 'request' ? 'Privada — solicitud' : 'Abierta';
}

export function joinModeShort(mode?: JoinMode): string {
  return mode === 'request' ? '🔒 Privada' : '🌐 Abierta';
}

export function canReviewJoinRequest(
  request: JoinRequest,
  routes: DrivingRoute[],
  meetups: Meetup[],
  reviewerEmail: string,
): boolean {
  if (request.meetupId) {
    const meetup = meetups.find((m) => m.id === request.meetupId);
    return meetup?.creatorEmail === reviewerEmail;
  }
  if (request.routeId) {
    const route = routes.find((r) => r.id === request.routeId);
    return route?.creatorEmail === reviewerEmail;
  }
  return false;
}
