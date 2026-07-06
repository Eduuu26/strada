import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { DEFAULT_GEO } from './geo';

export type GeoCoords = { latitude: number; longitude: number };

export type LocationFetchResult =
  | { ok: true; coords: GeoCoords; source: 'gps' | 'cached' }
  | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' | 'error'; message: string };

const WEB_TIMEOUT_MS = 12_000;

function webGeolocation(options?: { timeoutMs?: number }): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalización no disponible en este navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('PERMISSION_DENIED'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('TIMEOUT'));
        } else {
          reject(new Error(err.message || 'No se pudo obtener la ubicación.'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: options?.timeoutMs ?? WEB_TIMEOUT_MS,
        maximumAge: 60_000,
      },
    );
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Obtiene coordenadas del usuario. En web usa navigator.geolocation con timeout
 * (expo-location a veces se queda colgado). Debe llamarse tras un gesto del
 * usuario (tap) para que el navegador muestre el diálogo de permiso.
 */
export async function fetchUserCoords(opts?: {
  requestPermission?: boolean;
  timeoutMs?: number;
  /** Ignora la última posición conocida y fuerza lectura GPS. */
  preferFresh?: boolean;
}): Promise<LocationFetchResult> {
  const timeoutMs = opts?.timeoutMs ?? WEB_TIMEOUT_MS;
  const requestPermission = opts?.requestPermission ?? true;
  const preferFresh = opts?.preferFresh ?? false;

  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        ok: false,
        reason: 'unavailable',
        message: 'Tu navegador no soporta geolocalización.',
      };
    }

    // Si ya tenemos permiso concedido, no hace falta volver a pedirlo.
    if (!requestPermission && navigator.permissions?.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          return {
            ok: false,
            reason: 'denied',
            message: 'Has bloqueado la ubicación. Actívala en los ajustes del navegador.',
          };
        }
      } catch {
        // permissions API no disponible; seguimos con getCurrentPosition
      }
    }

    try {
      const coords = await webGeolocation({ timeoutMs });
      return { ok: true, coords, source: 'gps' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'PERMISSION_DENIED') {
        return {
          ok: false,
          reason: 'denied',
          message: 'Permiso de ubicación denegado. Pulsa de nuevo y acepta cuando el navegador lo pida.',
        };
      }
      if (msg === 'TIMEOUT') {
        return {
          ok: false,
          reason: 'timeout',
          message: 'La ubicación tardó demasiado. Comprueba que el GPS esté activo e inténtalo otra vez.',
        };
      }
      return {
        ok: false,
        reason: 'error',
        message: msg || 'No se pudo obtener tu ubicación.',
      };
    }
  }

  // Nativo (iOS / Android)
  try {
    if (requestPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          ok: false,
          reason: 'denied',
          message: 'Activa la ubicación en Ajustes para ver clubes cerca de ti.',
        };
      }
    } else {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          ok: false,
          reason: 'denied',
          message: 'Permiso de ubicación no concedido.',
        };
      }
    }

    if (!preferFresh) {
      const cached = await Location.getLastKnownPositionAsync({ maxAge: 120_000 });
      if (cached) {
        return {
          ok: true,
          coords: {
            latitude: cached.coords.latitude,
            longitude: cached.coords.longitude,
          },
          source: 'cached',
        };
      }
    }

    const pos = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs,
      'TIMEOUT',
    );
    return {
      ok: true,
      coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      source: 'gps',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'TIMEOUT') {
      return { ok: false, reason: 'timeout', message: 'La ubicación tardó demasiado.' };
    }
    return {
      ok: false,
      reason: 'error',
      message: 'No se pudo obtener tu ubicación.',
    };
  }
}

export { DEFAULT_GEO };
