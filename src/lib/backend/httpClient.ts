import { getStradaApiUrl } from './config';
import { getBackendAccessToken } from './session';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function stradaApiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const base = getStradaApiUrl();
  if (!base) return { ok: false, error: 'API Strada no configurada.' };

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false) {
    const token = await getBackendAccessToken();
    if (!token) return { ok: false, error: 'Sesión requerida.' };
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; data?: T };
    if (!res.ok) {
      return { ok: false, error: json.error ?? `Error ${res.status}`, status: res.status };
    }
    if (json.data !== undefined) return { ok: true, data: json.data as T };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}
