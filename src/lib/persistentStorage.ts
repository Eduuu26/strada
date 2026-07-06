import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memory = new Map<string, string>();

export async function hydrateAppStorage(keys: string[]): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return;
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [key, value] of pairs) {
    if (key && value != null) memory.set(key, value);
  }
}

export function readAppStorage(key: string): string | null {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memory.get(key) ?? null;
}

export async function writeAppStorage(key: string, value: string): Promise<void> {
  memory.set(key, value);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function removeAppStorage(key: string): Promise<void> {
  memory.delete(key);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}
