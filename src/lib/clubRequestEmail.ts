import type { ClubCreationRequest } from '../types';
import { getEmailApiBaseUrl } from './emailApiConfig';
import { tryGetSupabase } from './supabase/client';

type EmailResult = { ok: true } | { ok: false; error: string };

async function getSessionToken(): Promise<string | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

async function postEmail(path: string, body: unknown): Promise<EmailResult> {
  const base = getEmailApiBaseUrl();
  const token = await getSessionToken();

  if (!token) {
    return {
      ok: false,
      error: 'Debes iniciar sesión para enviar notificaciones por correo.',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'No se pudo contactar con el servidor de email.',
    };
  }
}

function requestPayload(request: ClubCreationRequest) {
  return {
    id: request.id,
    name: request.name,
    description: request.description,
    vehicleMode: request.vehicleMode,
    locationLabel: request.locationLabel,
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail,
    createdAt: request.createdAt,
  };
}

export async function notifyClubRequestSubmitted(
  request: ClubCreationRequest,
): Promise<EmailResult> {
  return postEmail('/api/email/club-request', { request: requestPayload(request) });
}

export async function notifyClubRequestApproved(
  request: ClubCreationRequest,
  clubId?: string,
): Promise<EmailResult> {
  return postEmail('/api/email/club-decision', {
    decision: 'approved',
    request: requestPayload(request),
    clubId,
  });
}

export async function notifyClubRequestRejected(
  request: ClubCreationRequest,
): Promise<EmailResult> {
  return postEmail('/api/email/club-decision', {
    decision: 'rejected',
    request: requestPayload(request),
  });
}
