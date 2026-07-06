import type { GeoLineString, GeoPoint, LngLat } from '../types';

// ---------------------------------------------------------------------------
// Helpers de geometría GeoJSON (SRID 4326) para rutas de comunidad.
// Operan sobre coordenadas [lng, lat] (orden GeoJSON), no [lat, lng].
// Independiente de src/lib/geo.ts (que usa {latitude, longitude} para clubs).
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia haversine en metros entre dos puntos [lng, lat]. */
export function haversineMeters(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Longitud total de una polilínea en metros. */
export function lineDistanceMeters(line: GeoLineString): number {
  const coords = line.coordinates;
  let total = 0;
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineMeters(coords[i - 1], coords[i]);
  }
  return Math.round(total);
}

export type Bounds = { minLng: number; minLat: number; maxLng: number; maxLat: number };

/** Caja envolvente de la ruta (útil para encuadrar el mapa). */
export function routeBounds(line: GeoLineString): Bounds | null {
  if (!line.coordinates.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of line.coordinates) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLng, minLat, maxLng, maxLat };
}

/** Centro geográfico aproximado (centro de la caja envolvente). */
export function lineCenter(line: GeoLineString): LngLat | null {
  const b = routeBounds(line);
  if (!b) return null;
  return [(b.minLng + b.maxLng) / 2, (b.minLat + b.maxLat) / 2];
}

export function isValidLngLat(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

export function isValidGeoPoint(value: unknown): value is GeoPoint {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as GeoPoint).type === 'Point' &&
    isValidLngLat((value as GeoPoint).coordinates)
  );
}

export function isValidLineString(value: unknown): value is GeoLineString {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as GeoLineString).type === 'LineString' &&
    Array.isArray((value as GeoLineString).coordinates) &&
    (value as GeoLineString).coordinates.length >= 2 &&
    (value as GeoLineString).coordinates.every(isValidLngLat)
  );
}

export function formatMeters(meters: number | null | undefined): string {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}
