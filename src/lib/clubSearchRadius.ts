import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { readAppStorage, writeAppStorage } from './persistentStorage';

export type ClubSearchRadiusId = 'spain' | '25' | '50' | '100' | '250';

export const CLUB_SEARCH_RADIUS_STORAGE_KEY = 'strada_club_search_radius_v1';

export const DEFAULT_CLUB_SEARCH_RADIUS: ClubSearchRadiusId = 'spain';

export const CLUB_SEARCH_RADIUS_OPTIONS: {
  id: ClubSearchRadiusId;
  label: string;
  maxKm: number | null;
}[] = [
  { id: 'spain', label: 'Toda España', maxKm: null },
  { id: '25', label: '25 km', maxKm: 25 },
  { id: '50', label: '50 km', maxKm: 50 },
  { id: '100', label: '100 km', maxKm: 100 },
  { id: '250', label: '250 km', maxKm: 250 },
];

let memoryRadiusId: ClubSearchRadiusId = DEFAULT_CLUB_SEARCH_RADIUS;

function isValidRadiusId(value: string): value is ClubSearchRadiusId {
  return CLUB_SEARCH_RADIUS_OPTIONS.some((option) => option.id === value);
}

export function clubSearchRadiusMaxKm(id: ClubSearchRadiusId): number | null {
  return CLUB_SEARCH_RADIUS_OPTIONS.find((option) => option.id === id)?.maxKm ?? null;
}

export function clubSearchRadiusLabel(id: ClubSearchRadiusId): string {
  return CLUB_SEARCH_RADIUS_OPTIONS.find((option) => option.id === id)?.label ?? 'Toda España';
}

export function clubSearchSectionTitle(id: ClubSearchRadiusId): string {
  if (id === 'spain') return 'Clubes en España';
  return `Clubes cerca (${clubSearchRadiusLabel(id)})`;
}

export function clubSearchEmptyMessage(id: ClubSearchRadiusId): string {
  if (id === 'spain') {
    return 'No hay clubes con ubicación registrada en España.';
  }
  return `No hay clubes en un radio de ${clubSearchRadiusLabel(id)} desde tu posición.`;
}

export function loadClubSearchRadius(): ClubSearchRadiusId {
  const stored = readAppStorage(CLUB_SEARCH_RADIUS_STORAGE_KEY);
  if (stored && isValidRadiusId(stored)) return stored;
  return memoryRadiusId;
}

export function saveClubSearchRadius(id: ClubSearchRadiusId) {
  memoryRadiusId = id;
  void writeAppStorage(CLUB_SEARCH_RADIUS_STORAGE_KEY, id);
}

export async function hydrateClubSearchRadius(): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return;
  const stored = await AsyncStorage.getItem(CLUB_SEARCH_RADIUS_STORAGE_KEY);
  if (stored && isValidRadiusId(stored)) memoryRadiusId = stored;
}
