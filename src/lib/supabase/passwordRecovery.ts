import { getSupabaseAnonKey, getSupabaseUrl } from '../env';

/**
 * Actualiza la contraseña usando directamente el access_token del enlace de
 * recuperación, vía REST. Evitamos `setSession`/`updateUser` del cliente porque
 * en web pueden quedarse colgados (lock/getSession).
 */
export async function updatePasswordWithAccessToken(
  accessToken: string,
  newPassword: string,
): Promise<void> {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) throw new Error('Supabase no está configurado.');

  const res = await fetch(`${url}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!res.ok) {
    let message = 'No se pudo actualizar la contraseña. El enlace puede haber caducado.';
    try {
      const body = await res.json();
      message = body.msg || body.error_description || body.message || message;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(message);
  }
}
