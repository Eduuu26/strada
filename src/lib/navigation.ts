import { Linking, Platform } from 'react-native';
import type { DrivingRoute, RouteStop } from '../types';

/** Abre Google Maps con waypoints (MVP hasta tener navegación propia). */
export async function openInMaps(stops: RouteStop[]): Promise<void> {
  if (stops.length === 0) return;

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const middle = stops.slice(1, -1);

  const waypointParam =
    middle.length > 0
      ? `&waypoints=${middle.map((s) => `${s.latitude},${s.longitude}`).join('|')}`
      : '';

  const googleUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${origin.latitude},${origin.longitude}` +
    `&destination=${destination.latitude},${destination.longitude}` +
    waypointParam +
    `&travelmode=driving`;

  const appleUrl =
    middle.length > 0
      ? `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}` +
        `&daddr=${middle.map((s) => `${s.latitude},${s.longitude}`).join('+to:')}+to:${destination.latitude},${destination.longitude}`
      : `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}&daddr=${destination.latitude},${destination.longitude}`;

  const url = Platform.OS === 'ios' ? appleUrl : googleUrl;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    await Linking.openURL(googleUrl);
    return;
  }
  await Linking.openURL(url);
}

/** Coordenadas del punto de encuentro (primera parada si no hay meetingLat explícito). */
export function getMeetingCoords(route: DrivingRoute): { lat: number; lng: number } | null {
  if (route.meetingLat != null && route.meetingLng != null) {
    return { lat: route.meetingLat, lng: route.meetingLng };
  }
  const first = route.stops[0];
  if (!first) return null;
  return { lat: first.latitude, lng: first.longitude };
}

/** Abre navegación al punto de encuentro de una quedada. */
export async function openMeetingPoint(
  route: DrivingRoute,
  provider: 'google' | 'waze' = 'google',
): Promise<void> {
  const coords = getMeetingCoords(route);
  if (!coords) return;

  const { lat, lng } = coords;
  const url =
    provider === 'waze'
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  await Linking.openURL(url);
}

export function stopSummary(stops: RouteStop[]): string {
  if (stops.length === 0) return 'Sin paradas';
  if (stops.length === 1) return stops[0].name;
  return `${stops.length} paradas · ${stops[0].name} → ${stops[stops.length - 1].name}`;
}
