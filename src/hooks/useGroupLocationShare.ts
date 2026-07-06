import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  removeGroupLocation,
  subscribeToGroupLocations,
  upsertGroupLocation,
  type GroupLocation,
} from '../lib/supabase/groupLocationsRepository';
import { isBackendConfigured } from '../lib/env';

const MIN_PUBLISH_MS = 8000;

export type GroupShareStatus = 'off' | 'pending' | 'active' | 'denied' | 'error';

/**
 * Comparte la ubicación del usuario con el grupo de una ruta.
 * En modo local (sin backend) mantiene solo la posición propia en memoria.
 */
export function useGroupLocationShare(
  routeId: string | undefined,
  user: { email: string; name: string } | undefined,
  enabled: boolean,
) {
  const [locations, setLocations] = useState<GroupLocation[]>([]);
  const [status, setStatus] = useState<GroupShareStatus>('off');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastPublishRef = useRef(0);
  const userEmail = user?.email;
  const userName = user?.name;

  const mergeOwnLocation = useCallback(
    (loc: Omit<GroupLocation, 'updatedAt'>) => {
      const updatedAt = new Date().toISOString();
      setLocations((prev) => {
        const key = loc.userEmail.toLowerCase();
        const rest = prev.filter((p) => p.userEmail.toLowerCase() !== key);
        return [...rest, { ...loc, updatedAt }];
      });
    },
    [],
  );

  const publishCoords = useCallback(
    async (latitude: number, longitude: number) => {
      if (!routeId || !userEmail || !userName || !enabled) return;

      const loc = { routeId, userEmail, userName, latitude, longitude };

      if (isBackendConfigured()) {
        const result = await upsertGroupLocation(loc);
        if (!result.ok) {
          setStatus('error');
          setErrorMessage(result.error);
          return;
        }
      }

      mergeOwnLocation(loc);
      setStatus('active');
      setErrorMessage(null);
    },
    [routeId, userEmail, userName, enabled, mergeOwnLocation],
  );

  const publish = useCallback(async () => {
    if (!routeId || !userEmail || !userName || !enabled) return;

    setStatus((s) => (s === 'active' ? 'active' : 'pending'));

    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        setErrorMessage(
          Platform.OS === 'web'
            ? 'Permiso de ubicación denegado. Haz clic en el candado de la barra del navegador y permite la ubicación.'
            : 'Permiso de ubicación denegado. Actívalo en Ajustes del dispositivo.',
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lastPublishRef.current = Date.now();
      await publishCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setStatus('error');
      setErrorMessage(
        Platform.OS === 'web'
          ? 'No se pudo obtener tu posición. Comprueba que el navegador tenga acceso al GPS.'
          : 'No se pudo obtener tu posición GPS.',
      );
    }
  }, [routeId, userEmail, userName, enabled, publishCoords]);

  useEffect(() => {
    if (!enabled || !routeId) {
      setLocations([]);
      setStatus('off');
      setErrorMessage(null);
      return;
    }

    if (!userEmail) {
      setStatus('error');
      setErrorMessage('Inicia sesión para compartir tu ubicación con el grupo.');
      return;
    }

    if (isBackendConfigured()) {
      return subscribeToGroupLocations(routeId, setLocations);
    }
    return undefined;
  }, [enabled, routeId, userEmail]);

  useEffect(() => {
    if (!enabled || !routeId || !userEmail) {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }

    const capturedRouteId = routeId;
    const capturedEmail = userEmail;
    let cancelled = false;

    void (async () => {
      setStatus('pending');
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (perm !== 'granted') {
        setStatus('denied');
        setErrorMessage(
          Platform.OS === 'web'
            ? 'Permiso de ubicación denegado. Haz clic en el candado de la barra del navegador y permite la ubicación.'
            : 'Permiso de ubicación denegado. Actívalo en Ajustes del dispositivo.',
        );
        return;
      }

      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        lastPublishRef.current = Date.now();
        await publishCoords(initial.coords.latitude, initial.coords.longitude);

        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 20,
            timeInterval: MIN_PUBLISH_MS,
          },
          (pos) => {
            const now = Date.now();
            if (now - lastPublishRef.current < MIN_PUBLISH_MS) return;
            lastPublishRef.current = now;
            void publishCoords(pos.coords.latitude, pos.coords.longitude);
          },
        );
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            Platform.OS === 'web'
              ? 'No se pudo obtener tu posición. Comprueba que el navegador tenga acceso al GPS.'
              : 'No se pudo obtener tu posición GPS.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
      void removeGroupLocation(capturedRouteId, capturedEmail);
    };
  }, [enabled, routeId, userEmail, publishCoords]);

  return {
    locations,
    sharing: status === 'active',
    status,
    errorMessage,
    retry: publish,
  };
}
