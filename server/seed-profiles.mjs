/** Perfiles demo para API v1 (sin Supabase). Mantener alineado con src/data/carMatchSeed.ts */
const PROFILES = [
  {
    email: 'laura@strada.es',
    name: 'Laura M.',
    vehicles: [
      {
        id: 'v1',
        type: 'coche',
        brand: 'Porsche',
        model: '911 Carrera',
        year: 2021,
        label: 'Porsche 911 Carrera (2021)',
        photoUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
        isDefault: true,
      },
    ],
    socials: { instagram: 'laura_m', tiktok: '', x: '', youtube: '' },
  },
  {
    email: 'carlos@strada.es',
    name: 'Carlos R.',
    vehicles: [
      {
        id: 'v1',
        type: 'moto',
        brand: 'Ducati',
        model: 'Monster',
        year: 2020,
        label: 'Ducati Monster (2020)',
        photoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
        isDefault: true,
      },
    ],
    socials: { instagram: 'carlos_r', tiktok: '', x: '', youtube: '' },
  },
  {
    email: 'miguel@strada.es',
    name: 'Miguel S.',
    vehicles: [
      {
        id: 'v1',
        type: 'coche',
        brand: 'BMW',
        model: 'M3',
        year: 2019,
        label: 'BMW M3 (2019)',
        photoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
        isDefault: true,
      },
    ],
    socials: { instagram: 'miguel_s', tiktok: '', x: '', youtube: '' },
  },
  {
    email: 'ana@strada.es',
    name: 'Ana G.',
    vehicles: [
      {
        id: 'v1',
        type: 'coche',
        brand: 'Mini',
        model: 'Cooper S',
        year: 2022,
        label: 'Mini Cooper S (2022)',
        photoUrl: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=600&q=80',
        isDefault: true,
      },
    ],
    socials: { instagram: 'ana_g', tiktok: '', x: '', youtube: '' },
  },
  {
    email: 'pedro@strada.es',
    name: 'Pedro L.',
    vehicles: [
      {
        id: 'v1',
        type: 'moto',
        brand: 'Kawasaki',
        model: 'Z900',
        year: 2023,
        label: 'Kawasaki Z900 (2023)',
        photoUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
        isDefault: true,
      },
    ],
    socials: { instagram: 'pedro_l', tiktok: '', x: '', youtube: '' },
  },
];

const byEmail = new Map(PROFILES.map((p) => [p.email.toLowerCase(), p]));

export function getSeedProfile(email) {
  return byEmail.get(String(email).trim().toLowerCase()) ?? null;
}

export function listSeedProfiles() {
  return [...PROFILES];
}
