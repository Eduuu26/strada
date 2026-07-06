import { tryGetSupabase } from './client';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export async function deleteUserAccount(): Promise<Result<void>> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Eliminar cuenta requiere conexión con el servidor.' };
  const { data, error } = await sb.functions.invoke('delete-account', { body: {} });
  if (error || data?.error) {
    return { ok: false, error: (data?.error as string) ?? error?.message ?? 'No se pudo eliminar la cuenta.' };
  }
  await sb.auth.signOut();
  return { ok: true, value: undefined };
}

export async function exportUserData(): Promise<Result<Record<string, unknown>>> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Exportar datos requiere conexión con el servidor.' };
  const { data, error } = await sb.functions.invoke('export-user-data', { body: {} });
  if (error || data?.error) {
    return { ok: false, error: (data?.error as string) ?? error?.message ?? 'No se pudo exportar.' };
  }
  return { ok: true, value: (data?.export ?? data) as Record<string, unknown> };
}

export async function cancelCommunitySubscription(communityId: string): Promise<Result<void>> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Pagos no disponibles en modo local.' };
  const { data, error } = await sb.functions.invoke('cancel-subscription', {
    body: { communityId },
  });
  if (error || data?.error) {
    return {
      ok: false,
      error: (data?.error as string) ?? error?.message ?? 'No se pudo cancelar la suscripción.',
    };
  }
  return { ok: true, value: undefined };
}

export async function openBillingPortal(returnUrl?: string): Promise<Result<string>> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Portal de facturación no disponible en modo local.' };
  const { data, error } = await sb.functions.invoke('create-billing-portal', {
    body: { returnUrl },
  });
  if (error || !data?.url) {
    return {
      ok: false,
      error: (data?.error as string) ?? error?.message ?? 'No se pudo abrir el portal de facturación.',
    };
  }
  return { ok: true, value: data.url as string };
}
