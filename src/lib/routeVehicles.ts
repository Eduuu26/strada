import type { DrivingRoute, RouteDifficulty, VehicleType } from '../types';

export type RouteVehicleMode = 'mixto' | 'coches' | 'motos';

export const ROUTE_VEHICLE_MODES: { id: RouteVehicleMode; label: string; icon: string }[] = [
  { id: 'mixto', label: 'Coches y motos', icon: '🚗🏍️' },
  { id: 'coches', label: 'Solo coches', icon: '🚗' },
  { id: 'motos', label: 'Solo motos', icon: '🏍️' },
];

export function routeVehicleModeLabel(mode?: RouteVehicleMode): string {
  return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.label ?? 'Coches y motos';
}

export function routeVehicleModeIcon(mode?: RouteVehicleMode): string {
  return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.icon ?? '🚗🏍️';
}

export function isMotoVehicle(type: VehicleType): boolean {
  return type === 'moto';
}

export function vehicleMatchesRoute(route: Pick<DrivingRoute, 'vehicleMode'>, type: VehicleType): boolean {
  const mode = route.vehicleMode ?? 'mixto';
  if (mode === 'mixto') return true;
  if (mode === 'motos') return isMotoVehicle(type);
  return !isMotoVehicle(type);
}

export function routeMatchesVehicleFilter(route: Pick<DrivingRoute, 'vehicleMode'>, filter: string): boolean {
  if (filter !== 'motos' && filter !== 'coches') return true;
  const mode = route.vehicleMode ?? 'mixto';
  if (filter === 'motos') return mode === 'motos' || mode === 'mixto';
  if (filter === 'coches') return mode === 'coches' || mode === 'mixto';
  return true;
}

const DIFFICULTY_LABELS: Record<RouteDifficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  exigente: 'Exigente',
};

export function routeDifficultyLabel(difficulty: RouteDifficulty): string {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

export const ROUTE_DIFFICULTIES: { id: RouteDifficulty | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'exigente', label: 'Exigente' },
];
