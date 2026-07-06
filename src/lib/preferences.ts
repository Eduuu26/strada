import type { FuelPreference, VehiclePreference } from '../types';

export const VEHICLE_PREFERENCE_OPTIONS: {
  id: VehiclePreference;
  label: string;
  icon: string;
}[] = [
  { id: 'coche', label: 'Coche', icon: '🚗' },
  { id: 'moto', label: 'Moto', icon: '🏍️' },
  { id: 'ambos', label: 'Ambos', icon: '🚗🏍️' },
];

export const FUEL_PREFERENCE_OPTIONS: {
  id: FuelPreference;
  label: string;
}[] = [
  { id: '95', label: 'Gasolina 95' },
  { id: '98', label: 'Gasolina 98' },
  { id: 'diesel', label: 'Diésel' },
  { id: 'gnc', label: 'GNC' },
];

export function vehiclePreferenceLabel(value?: VehiclePreference): string {
  return VEHICLE_PREFERENCE_OPTIONS.find((o) => o.id === value)?.label ?? 'Sin definir';
}

export function fuelPreferenceLabel(value?: FuelPreference): string {
  return FUEL_PREFERENCE_OPTIONS.find((o) => o.id === value)?.label ?? 'Sin definir';
}

export function isVehiclePreference(value: unknown): value is VehiclePreference {
  return value === 'coche' || value === 'moto' || value === 'ambos';
}

export function isFuelPreference(value: unknown): value is FuelPreference {
  return value === '95' || value === '98' || value === 'diesel' || value === 'gnc';
}
