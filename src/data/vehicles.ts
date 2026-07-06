import type { RouteVehicleMode, UserVehicle, VehicleFormInput, VehicleType } from '../types';
import { isMotoVehicle } from '../lib/routeVehicles';
import { findCatalogBrand, findCatalogModel, validateVehicleBrandModel } from './vehicleCatalog';
import { assertVehiclePhotoSize } from '../lib/security/vehiclePhotoValidation';
import { DEFAULT_VEHICLE_PHOTOS } from './vehiclePhotoAssets';
export { DEFAULT_VEHICLE_PHOTOS, VEHICLE_PHOTO_PRESETS } from './vehiclePhotoAssets';

export const VEHICLE_OPTIONS: { id: VehicleType; label: string; icon: string }[] = [
  { id: 'coche', label: 'Coche', icon: '🚗' },
  { id: 'moto', label: 'Moto', icon: '🏍️' },
];

export function vehicleIcon(type: VehicleType): string {
  return VEHICLE_OPTIONS.find((v) => v.id === type)?.icon ?? '🚗';
}

export function vehicleLabel(type: VehicleType): string {
  return VEHICLE_OPTIONS.find((v) => v.id === type)?.label ?? 'Coche';
}

export function coerceVehicleType(type?: string): VehicleType {
  return type === 'moto' ? 'moto' : 'coche';
}

export function buildVehicleLabel(brand: string, model: string, year: number): string {
  return `${brand.trim()} ${model.trim()} (${year})`;
}

export function validateVehicleInput(
  type: VehicleType,
  brand: string,
  model: string,
  yearText: string,
  photoUrl?: string,
): string | null {
  const brandModelError = validateVehicleBrandModel(type, brand, model);
  if (brandModelError) return brandModelError;
  const year = Number(yearText);
  const maxYear = new Date().getFullYear() + 1;
  if (!yearText.trim() || !Number.isInteger(year) || year < 1950 || year > maxYear) {
    return `Indica un año válido (1950–${maxYear}).`;
  }
  if (!photoUrl?.trim()) {
    return 'Sube al menos una foto de tu coche o moto.';
  }
  try {
    assertVehiclePhotoSize(photoUrl.trim());
  } catch (e) {
    return e instanceof Error ? e.message : 'La foto es demasiado grande.';
  }
  return null;
}

export function normalizeUserVehicle(vehicle: UserVehicle): UserVehicle {
  const type = coerceVehicleType(vehicle.type);
  const brand = vehicle.brand?.trim() || '';
  const model = vehicle.model?.trim() || '';
  const year = vehicle.year;
  let label = vehicle.label?.trim() || '';

  if (brand && model && year) {
    label = buildVehicleLabel(brand, model, year);
  } else if (!brand && !model && label) {
    return { ...vehicle, type, brand: '', model: label, label };
  } else if (brand && model) {
    label = year ? buildVehicleLabel(brand, model, year) : `${brand} ${model}`.trim();
  }

  return {
    ...vehicle,
    type,
    brand,
    model: model || label,
    year,
    label: label || `${brand} ${model}`.trim() || 'Vehículo',
  };
}

export function vehicleDisplayTitle(vehicle: UserVehicle): string {
  if (vehicle.brand && vehicle.model) return `${vehicle.brand} ${vehicle.model}`;
  return vehicle.label;
}

export function vehicleDisplayMeta(vehicle: UserVehicle): string {
  const parts = [vehicleLabel(vehicle.type)];
  if (vehicle.year) parts.push(String(vehicle.year));
  return parts.join(' · ');
}

export function vehiclePhotoUrl(vehicle: Pick<UserVehicle, 'type' | 'photoUrl'>): string {
  return vehicle.photoUrl?.trim() || DEFAULT_VEHICLE_PHOTOS[vehicle.type] || DEFAULT_VEHICLE_PHOTOS.coche;
}

export function vehicleMatchesClubMode(mode: RouteVehicleMode | undefined, type: VehicleType): boolean {
  const clubMode = mode ?? 'mixto';
  if (clubMode === 'mixto') return true;
  if (clubMode === 'motos') return isMotoVehicle(type);
  return !isMotoVehicle(type);
}

export function memberVehiclesForClub(
  vehicles: UserVehicle[] | undefined,
  clubVehicleMode: RouteVehicleMode | undefined,
): UserVehicle[] {
  const list = (vehicles ?? []).filter((v) => vehicleMatchesClubMode(clubVehicleMode, v.type));
  return [...list].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
}

import { sanitizeImageUrl } from '../lib/security/sanitize';

export function vehicleFromFormInput(input: VehicleFormInput): Omit<UserVehicle, 'id' | 'isDefault'> {
  const canonicalBrand = findCatalogBrand(input.type, input.brand.trim()) ?? input.brand.trim();
  const canonicalModel =
    findCatalogModel(canonicalBrand, input.model.trim()) ?? input.model.trim();
  const year = input.year;
  const photoUrl = sanitizeImageUrl(input.photoUrl.trim());
  return {
    type: input.type,
    brand: canonicalBrand,
    model: canonicalModel,
    year,
    label: buildVehicleLabel(canonicalBrand, canonicalModel, year),
    photoUrl: photoUrl || undefined,
  };
}
