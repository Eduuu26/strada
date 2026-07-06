import type { VehicleType } from '../types';

export const DEFAULT_VEHICLE_PHOTOS: Record<VehicleType, string> = {
  coche: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
  moto: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
};

export const VEHICLE_PHOTO_PRESETS: { id: string; type: VehicleType; url: string; label: string }[] = [
  { id: 'car1', type: 'coche', url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', label: 'Deportivo' },
  { id: 'car2', type: 'coche', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80', label: 'Clásico' },
  { id: 'car3', type: 'coche', url: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=600&q=80', label: 'Compacto' },
  { id: 'car4', type: 'coche', url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80', label: 'Berlina' },
  { id: 'moto1', type: 'moto', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80', label: 'Naked' },
  { id: 'moto2', type: 'moto', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', label: 'Sport' },
  { id: 'moto3', type: 'moto', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80', label: 'Touring' },
];
