import { useCallback, useEffect, useState } from 'react';

import { fetchFuelStationsNearRoute } from '../lib/supabase/fuelStationsRepository';
import type { FuelPreference, FuelStationNearRoute } from '../types';

/**
 * Gasolineras cercanas a una ruta para el combustible indicado (normalmente el
 * `fuelPref` del perfil). Ordenadas por distancia y, a igualdad, las puede
 * reordenar el consumidor por precio. En modo local devuelve [].
 */
export function useFuelStationsNearRoute(
  routeId: string | undefined,
  fuelKey: FuelPreference | undefined,
  radiusM = 2000,
) {
  const [stations, setStations] = useState<FuelStationNearRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!routeId || !fuelKey) {
      setStations([]);
      return;
    }
    setLoading(true);
    try {
      setStations(await fetchFuelStationsNearRoute(routeId, fuelKey, radiusM));
    } finally {
      setLoading(false);
    }
  }, [routeId, fuelKey, radiusM]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Más barata primero (dentro del radio). */
  const cheapest = stations.length
    ? [...stations].sort((a, b) => a.price - b.price)[0]
    : null;

  return { stations, loading, refresh, cheapest };
}
