import type { DrivingRoute, DriveEvent } from './types';

/** Rutas de ejemplo para el mercado español (MVP / seed). */
export const seedRoutes: DrivingRoute[] = [
  {
    id: 'ronda-caminito',
    title: 'Ronda y los pueblos blancos',
    region: 'Andalucía',
    province: 'Málaga',
    coverImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    description:
      'Ruta de montaña por carreteras sinuosas entre Ronda, Setenil y Grazalema. Curvas amplias, pueblos blancos colgados y paradas fotográficas en miradores.',
    distanceKm: 142,
    durationMin: 210,
    difficulty: 'media',
    vehicleMode: 'mixto',
    tags: ['montaña', 'curvas', 'fotos'],
    stops: [
      { id: 's1', name: 'Ronda — Puente Nuevo', latitude: 36.7416, longitude: -5.1671 },
      { id: 's2', name: 'Setenil de las Bodegas', latitude: 36.8628, longitude: -5.1775 },
      { id: 's3', name: 'Grazalema', latitude: 36.7656, longitude: -5.3661 },
    ],
    meetingAt: '2026-07-26T09:00:00+02:00',
    meetingPoint: 'Aparcamiento Puente Nuevo, Ronda',
    meetingLat: 36.7416,
    meetingLng: -5.1671,
    navInstruction: 'Salida hacia Setenil de las Bodegas',
    navNextKm: 12.4,
    maxAttendees: 25,
    creatorName: 'Carlos R.',
    creatorEmail: 'carlos@strada.es',
  },
  {
    id: 'puerto-panderruedas',
    title: 'Puerto de Panderruedas (Picos)',
    region: 'Cantabria',
    province: 'Cantabria',
    coverImage: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
    description:
      'Subida exigente hacia los Picos de Europa con tramos de curvas cerradas y firme variable. Parada en el mirador del teleférico.',
    distanceKm: 68,
    durationMin: 95,
    difficulty: 'exigente',
    vehicleMode: 'mixto',
    tags: ['puerto', 'montaña', 'paisaje'],
    stops: [
      { id: 's1', name: 'Liébana — Potes', latitude: 43.1539, longitude: -4.6219 },
      { id: 's2', name: 'Mirador del Cable', latitude: 43.1882, longitude: -4.8124 },
      { id: 's3', name: 'Fuente Dé', latitude: 43.1953, longitude: -4.8128 },
    ],
    meetingAt: '2026-08-02T08:00:00+02:00',
    meetingPoint: 'Plaza del Ayuntamiento, Potes',
    meetingLat: 43.1539,
    meetingLng: -4.6219,
    navInstruction: 'Sube por el puerto hacia Fuente Dé',
    navNextKm: 8.1,
    maxAttendees: 15,
    creatorName: 'Miguel S.',
    creatorEmail: 'miguel@strada.es',
  },
  {
    id: 'sierra-madrid',
    title: 'Sierra de Madrid — La Moraleja a Navacerrada',
    region: 'Comunidad de Madrid',
    province: 'Madrid',
    coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    description:
      'Salida rápida desde Madrid por carreteras de curvas suaves y buen firme. Parada en Miraflores. Perfecta para quedada dominical.',
    distanceKm: 54,
    durationMin: 75,
    difficulty: 'facil',
    vehicleMode: 'mixto',
    tags: ['quedada', 'curvas', 'cerca'],
    stops: [
      { id: 's1', name: 'La Moraleja', latitude: 40.5186, longitude: -3.8267 },
      { id: 's2', name: 'Miraflores de la Sierra', latitude: 40.8136, longitude: -3.7683 },
      { id: 's3', name: 'Puerto de Navacerrada', latitude: 40.7417, longitude: -4.0042 },
    ],
    meetingAt: '2026-07-12T09:00:00+02:00',
    meetingPoint: 'Gasolinera La Moraleja (A-1)',
    meetingLat: 40.5186,
    meetingLng: -3.8267,
    navInstruction: 'Continúa por M-607 hacia Miraflores',
    navNextKm: 6.2,
    maxAttendees: 20,
    creatorName: 'Laura M.',
    creatorEmail: 'laura@strada.es',
  },
  {
    id: 'cabo-gata',
    title: 'Cabo de Gata — costa volcánica',
    region: 'Andalucía',
    province: 'Almería',
    coverImage: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=800&q=80',
    description:
      'Ruta costera panorámica por el parque natural con tramos junto al mar y calas volcánicas. Ritmo relajado y muchas fotos.',
    distanceKm: 88,
    durationMin: 120,
    difficulty: 'facil',
    vehicleMode: 'mixto',
    tags: ['costa', 'fotos', 'tranquila'],
    stops: [
      { id: 's1', name: 'San José', latitude: 36.7631, longitude: -2.1067 },
      { id: 's2', name: 'Los Genoveses', latitude: 36.7231, longitude: -2.0789 },
      { id: 's3', name: 'Cabo de Gata', latitude: 36.7236, longitude: -2.1925 },
    ],
    meetingAt: '2026-08-09T10:00:00+02:00',
    meetingPoint: 'San José — centro',
    meetingLat: 36.7631,
    meetingLng: -2.1067,
    navInstruction: 'Sigue por la costa hacia Los Genoveses',
    navNextKm: 4.8,
    maxAttendees: 30,
    creatorName: 'Ana G.',
    creatorEmail: 'ana@strada.es',
  },
  {
    id: 'tramuntana-moto',
    title: 'Sa Calobra — ruta en moto',
    region: 'Islas Baleares',
    province: 'Mallorca',
    coverImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
    description:
      'Descenso mítico hasta Sa Calobra pensado para moto. Curvas enlazadas, poco tráfico temprano y parada en el mirador de la cordillera.',
    distanceKm: 112,
    durationMin: 165,
    difficulty: 'exigente',
    vehicleMode: 'motos',
    tags: ['moto', 'curvas', 'mallorca'],
    stops: [
      { id: 's1', name: 'Puerto de Sóller', latitude: 39.7961, longitude: 2.6956 },
      { id: 's2', name: 'Mirador de Sa Creueta', latitude: 39.8502, longitude: 2.8012 },
      { id: 's3', name: 'Sa Calobra', latitude: 39.8521, longitude: 2.8089 },
    ],
    meetingAt: '2026-09-06T07:00:00+02:00',
    meetingPoint: 'Puerto de Sóller',
    meetingLat: 39.7961,
    meetingLng: 2.6956,
    navInstruction: 'Baja por la Ma-2141 hacia Sa Calobra',
    navNextKm: 14.2,
    maxAttendees: 14,
    creatorName: 'Pedro L.',
    creatorEmail: 'pedro@strada.es',
  },
  {
    id: 'guadarrama-moto',
    title: 'Puerto de Navacerrada en moto',
    region: 'Comunidad de Madrid',
    province: 'Madrid',
    coverImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
    description:
      'Subida clásica desde la sierra madrileña. Ritmo ágil, curvas de montaña y café en el puerto. Quedada solo para motos.',
    distanceKm: 48,
    durationMin: 70,
    difficulty: 'media',
    vehicleMode: 'motos',
    tags: ['moto', 'sierra', 'quedada'],
    stops: [
      { id: 's1', name: 'Miraflores de la Sierra', latitude: 40.8136, longitude: -3.7683 },
      { id: 's2', name: 'Puerto de Navacerrada', latitude: 40.7417, longitude: -4.0042 },
    ],
    meetingAt: '2026-07-19T08:00:00+02:00',
    meetingPoint: 'Miraflores — plaza principal',
    meetingLat: 40.8136,
    meetingLng: -3.7683,
    navInstruction: 'Sube hacia el puerto de Navacerrada',
    navNextKm: 7.5,
    maxAttendees: 16,
    joinMode: 'request',
    creatorName: 'Laura M.',
    creatorEmail: 'laura@strada.es',
  },
];

export const seedEvents: DriveEvent[] = [
  {
    id: 'ev1',
    title: 'Salida dominical — Sierra de Madrid',
    routeId: 'sierra-madrid',
    meetingPoint: 'Gasolinera La Moraleja (A-1)',
    startsAt: '2026-07-12T09:00:00+02:00',
    attendees: 8,
    maxAttendees: 20,
  },
  {
    id: 'ev2',
    title: 'Picos — subida suave al Puerto',
    routeId: 'puerto-panderruedas',
    meetingPoint: 'Potes — plaza del ayuntamiento',
    startsAt: '2026-07-19T08:30:00+02:00',
    attendees: 5,
    maxAttendees: 12,
  },
];

export function getRouteById(id: string): DrivingRoute | undefined {
  return seedRoutes.find((route) => route.id === id);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
