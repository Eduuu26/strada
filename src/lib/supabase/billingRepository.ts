import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Puente cliente → Edge Functions de Stripe (Hito 1.5). Devuelven URLs que la
// UI abre con Linking. En modo local (sin Supabase) devuelven un error suave.
// ---------------------------------------------------------------------------

type UrlResult = { ok: true; url: string } | { ok: false; error: string };

/** Inicia el Checkout de suscripción a una comunidad de pago. */
export async function startCommunityCheckout(
  communityId: string,
  opts?: { successUrl?: string; cancelUrl?: string },
): Promise<UrlResult> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Pagos no disponibles en modo local.' };
  const { data, error } = await sb.functions.invoke('create-checkout-session', {
    body: { communityId, successUrl: opts?.successUrl, cancelUrl: opts?.cancelUrl },
  });
  if (error || !data?.url) {
    return { ok: false, error: data?.error ?? error?.message ?? 'No se pudo iniciar el pago.' };
  }
  return { ok: true, url: data.url as string };
}

/** Inicia (o continúa) el onboarding de Stripe Connect del owner. */
export async function startStripeOnboarding(
  communityId: string,
  opts?: { returnUrl?: string; refreshUrl?: string },
): Promise<UrlResult> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Stripe no disponible en modo local.' };
  const { data, error } = await sb.functions.invoke('stripe-connect-onboard', {
    body: { communityId, returnUrl: opts?.returnUrl, refreshUrl: opts?.refreshUrl },
  });
  if (error || !data?.url) {
    return { ok: false, error: data?.error ?? error?.message ?? 'No se pudo conectar Stripe.' };
  }
  return { ok: true, url: data.url as string };
}
