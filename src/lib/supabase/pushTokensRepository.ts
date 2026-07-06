import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Registro de tokens de Expo Push (Hito 1.7). Deliberadamente NO depende de
// `expo-notifications`: recibe el token ya obtenido, para no acoplar la capa de
// datos a una librería de cliente (que además aún no está instalada).
// El que llama obtiene el token (Notifications.getExpoPushTokenAsync()).
// ---------------------------------------------------------------------------

export type PushPlatform = 'ios' | 'android' | 'web';

export async function upsertPushToken(
  userId: string,
  token: string,
  platform: PushPlatform,
): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    );
  return !error;
}

export async function deletePushToken(userId: string, token: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);
  return !error;
}
