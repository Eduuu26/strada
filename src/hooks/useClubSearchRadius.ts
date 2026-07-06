import { useCallback, useEffect, useState } from 'react';
import {
  CLUB_SEARCH_RADIUS_STORAGE_KEY,
  clubSearchRadiusLabel,
  clubSearchRadiusMaxKm,
  DEFAULT_CLUB_SEARCH_RADIUS,
  hydrateClubSearchRadius,
  loadClubSearchRadius,
  saveClubSearchRadius,
  type ClubSearchRadiusId,
} from '../lib/clubSearchRadius';
import { LOGIN_ATTEMPTS_KEY } from '../lib/security/passwordPolicy';
import { hydrateAppStorage } from '../lib/persistentStorage';

let hydrated = false;

async function ensureAppStorageHydrated() {
  if (hydrated) return;
  await hydrateAppStorage([LOGIN_ATTEMPTS_KEY, CLUB_SEARCH_RADIUS_STORAGE_KEY]);
  await hydrateClubSearchRadius();
  hydrated = true;
}

export function useClubSearchRadius() {
  const [ready, setReady] = useState(hydrated);
  const [radiusId, setRadiusIdState] = useState<ClubSearchRadiusId>(DEFAULT_CLUB_SEARCH_RADIUS);

  useEffect(() => {
    void ensureAppStorageHydrated().then(() => {
      setRadiusIdState(loadClubSearchRadius());
      setReady(true);
    });
  }, []);

  const setRadiusId = useCallback((id: ClubSearchRadiusId) => {
    setRadiusIdState(id);
    saveClubSearchRadius(id);
  }, []);

  return {
    ready,
    radiusId,
    setRadiusId,
    maxKm: clubSearchRadiusMaxKm(radiusId),
    label: clubSearchRadiusLabel(radiusId),
  };
}
