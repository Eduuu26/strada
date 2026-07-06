import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DEFAULT_GEO } from '../lib/geo';
import { fetchUserCoords, type LocationFetchResult } from '../lib/geolocation';

export type UserLocationStatus = 'idle' | 'loading' | 'ready' | 'denied';

export type UserLocationState = {
  latitude: number;
  longitude: number;
  status: UserLocationStatus;
  /** Mensaje cuando status es denied (p. ej. permiso rechazado). */
  hint?: string;
};

type Options = {
  /** Si false, no pide ubicación al montar (recomendado en web hasta que el usuario pulse). */
  autoStart?: boolean;
};

export function useUserLocation(options: Options = {}) {
  const autoStart = options.autoStart ?? Platform.OS !== 'web';
  const [location, setLocation] = useState<UserLocationState>({
    latitude: DEFAULT_GEO.latitude,
    longitude: DEFAULT_GEO.longitude,
    status: 'idle',
  });
  const busy = useRef(false);

  const applyResult = useCallback((result: LocationFetchResult) => {
    if (result.ok) {
      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        status: 'ready',
        hint: undefined,
      });
      return result.coords;
    }
    setLocation({
      ...DEFAULT_GEO,
      status: 'denied',
      hint: result.message,
    });
    return DEFAULT_GEO;
  }, []);

  /** Pide permiso y lee GPS. Debe invocarse desde un botón (gesto del usuario). */
  const requestLocation = useCallback(async () => {
    if (busy.current) return DEFAULT_GEO;
    busy.current = true;
    setLocation((prev) => ({ ...prev, status: 'loading', hint: undefined }));
    try {
      const result = await fetchUserCoords({ requestPermission: true });
      return applyResult(result);
    } finally {
      busy.current = false;
    }
  }, [applyResult]);

  /** Actualiza coords (fuerza nueva lectura GPS). */
  const refresh = useCallback(async () => {
    if (busy.current) return DEFAULT_GEO;
    busy.current = true;
    setLocation((prev) => ({ ...prev, status: 'loading', hint: undefined }));
    try {
      const result = await fetchUserCoords({ requestPermission: true, preferFresh: true });
      return applyResult(result);
    } finally {
      busy.current = false;
    }
  }, [applyResult]);

  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    (async () => {
      setLocation((prev) => ({ ...prev, status: 'loading' }));
      const result = await fetchUserCoords({ requestPermission: true });
      if (!cancelled) applyResult(result);
    })();

    return () => {
      cancelled = true;
    };
  }, [autoStart, applyResult]);

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    status: location.status,
    hint: location.hint,
    requestLocation,
    refresh,
  };
}

export async function getCurrentCoords(): Promise<{ latitude: number; longitude: number }> {
  const result = await fetchUserCoords({ requestPermission: true });
  if (result.ok) return result.coords;
  return DEFAULT_GEO;
}
