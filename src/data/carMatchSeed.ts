import { VEHICLE_PHOTO_PRESETS } from './vehicles';
import type { CarMatchCard } from '../types';

/** Perfiles demo para Match cuando no hay backend de descubrimiento. */
export const SEED_CAR_MATCH_CARDS: CarMatchCard[] = [
  {
    id: 'laura@strada.es|v1',
    ownerEmail: 'laura@strada.es',
    ownerName: 'Laura M.',
    vehicle: {
      id: 'v1',
      type: 'coche',
      brand: 'Porsche',
      model: '911 Carrera',
      year: 2021,
      label: 'Porsche 911 Carrera (2021)',
      photoUrl: VEHICLE_PHOTO_PRESETS[0].url,
      isDefault: true,
    },
  },
  {
    id: 'carlos@strada.es|v1',
    ownerEmail: 'carlos@strada.es',
    ownerName: 'Carlos R.',
    vehicle: {
      id: 'v1',
      type: 'moto',
      brand: 'Ducati',
      model: 'Monster',
      year: 2020,
      label: 'Ducati Monster (2020)',
      photoUrl: VEHICLE_PHOTO_PRESETS[4].url,
      isDefault: true,
    },
  },
  {
    id: 'miguel@strada.es|v1',
    ownerEmail: 'miguel@strada.es',
    ownerName: 'Miguel S.',
    vehicle: {
      id: 'v1',
      type: 'coche',
      brand: 'BMW',
      model: 'M3',
      year: 2019,
      label: 'BMW M3 (2019)',
      photoUrl: VEHICLE_PHOTO_PRESETS[1].url,
      isDefault: true,
    },
  },
  {
    id: 'ana@strada.es|v1',
    ownerEmail: 'ana@strada.es',
    ownerName: 'Ana G.',
    vehicle: {
      id: 'v1',
      type: 'coche',
      brand: 'Mini',
      model: 'Cooper S',
      year: 2022,
      label: 'Mini Cooper S (2022)',
      photoUrl: VEHICLE_PHOTO_PRESETS[2].url,
      isDefault: true,
    },
  },
  {
    id: 'pedro@strada.es|v1',
    ownerEmail: 'pedro@strada.es',
    ownerName: 'Pedro L.',
    vehicle: {
      id: 'v1',
      type: 'moto',
      brand: 'Kawasaki',
      model: 'Z900',
      year: 2023,
      label: 'Kawasaki Z900 (2023)',
      photoUrl: VEHICLE_PHOTO_PRESETS[5].url,
      isDefault: true,
    },
  },
];
