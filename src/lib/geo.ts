export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export const DEFAULT_GEO: GeoPoint = {
  latitude: 40.4168,
  longitude: -3.7038,
};

export const NEARBY_CLUBS_LIMIT = 12;
export const NEARBY_CLUBS_SPAIN_LIMIT = 30;

const EARTH_RADIUS_KM = 6371;

export function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function hasGeoLocation(item: {
  latitude?: number;
  longitude?: number;
}): item is { latitude: number; longitude: number } {
  return item.latitude != null && item.longitude != null;
}
