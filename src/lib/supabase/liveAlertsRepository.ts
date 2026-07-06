import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Envío de avisos en directo (walkie-talkie nivel 1, Hito 1.7). Invoca la Edge
// Function send-live-alert, que valida que el emisor es gestor (RLS) y difunde
// la notificación push a los miembros activos.
// ---------------------------------------------------------------------------

export type SendLiveAlertResult =
  | { ok: true; sessionId: string; recipients: number; sent: number }
  | { ok: false; error: string };

export async function sendLiveAlert(
  routeId: string,
  body: string,
  title?: string,
): Promise<SendLiveAlertResult> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Avisos no disponibles en modo local.' };
  const { data, error } = await sb.functions.invoke('send-live-alert', {
    body: { routeId, body, title },
  });
  if (error || !data?.ok) {
    return { ok: false, error: data?.error ?? error?.message ?? 'No se pudo enviar el aviso.' };
  }
  return {
    ok: true,
    sessionId: data.sessionId as string,
    recipients: Number(data.recipients ?? 0),
    sent: Number(data.sent ?? 0),
  };
}
