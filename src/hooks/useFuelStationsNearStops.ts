import { useCallback, useEffect, useState } from 'react';

import { fetchFuelStationsNearStops } from '../lib/supabase/fuelStationsRepository';
import type { FuelPreference, FuelStationNearRoute } from '../types';

/**
 * Gasolineras a lo largo de una ruta (paradas) filtradas por el combustible del perfil.
 * Solo devuelve estaciones que tienen ese combustible en su tabla MITECO.
 */
export function useFuelStationsNearStops(
  stops: { latitude: number; longitude: number }[] | undefined,
  fuelKey: FuelPreference | undefined,
  radiusM = 2000,
) {
  const [stations, setStations] = useState<FuelStationNearRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!stops?.length || !fuelKey) {
      setStations([]);
      return;
    }
    setLoading(true);
    try {
      setStations(await fetchFuelStationsNearStops(stops, fuelKey, radiusM));
    } finally {
      setLoading(false);
    }
  }, [stops, fuelKey, radiusM]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const cheapest = stations.length
    ? [...stations].sort((a, b) => a.price - b.price)[0]
    : null;

  return { stations, loading, refresh, cheapest };
}
