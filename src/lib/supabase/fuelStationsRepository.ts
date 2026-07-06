import type { FuelPreference, FuelStationNearRoute, GeoPoint } from '../../types';
import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Consulta de gasolineras cercanas a una ruta filtradas por combustible.
// Usa la RPC fuel_stations_near_route (migración 20250627120000), que respeta
// la RLS de la ruta. En modo local devuelve [].
// ---------------------------------------------------------------------------

type FuelRpcRow = {
  id: number;
  brand: string | null;
  address: string | null;
  municipality: string | null;
  province: string | null;
  price: number;
  distance_m: number;
  geom: GeoPoint;
};

function fromRpc(row: FuelRpcRow): FuelStationNearRoute {
  return {
    id: row.id,
    brand: row.brand,
    address: row.address,
    municipality: row.municipality,
    province: row.province,
    price: Number(row.price),
    distanceM: Math.round(row.distance_m),
    geom: row.geom,
  };
}

export async function fetchFuelStationsNearRoute(
  routeId: string,
  fuelKey: FuelPreference,
  radiusM = 2000,
): Promise<FuelStationNearRoute[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('fuel_stations_near_route', {
    p_route_id: routeId,
    p_fuel_key: fuelKey,
    p_radius_m: radiusM,
  });
  if (error || !data) return [];
  return (data as FuelRpcRow[]).map(fromRpc);
}

/** Gasolineras cerca de paradas lat/lng (rutas de la app en Conducir). */
export async function fetchFuelStationsNearStops(
  stops: { latitude: number; longitude: number }[],
  fuelKey: FuelPreference,
  radiusM = 2000,
): Promise<FuelStationNearRoute[]> {
  const sb = tryGetSupabase();
  if (!sb || !stops.length) return [];
  const payload = stops.map((s) => ({ lat: s.latitude, lng: s.longitude }));
  const { data, error } = await sb.rpc('fuel_stations_near_stops', {
    p_stops: payload,
    p_fuel_key: fuelKey,
    p_radius_m: radiusM,
  });
  if (error || !data) return [];
  return (data as FuelRpcRow[]).map(fromRpc);
}
