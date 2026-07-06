import type { FeedPost } from '../types';

export const seedFeedPosts: FeedPost[] = [
  {
    id: 'post_seed_1',
    authorEmail: 'carlos@strada.es',
    authorName: 'Carlos R.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    caption: 'Domingo de curvas en la Sierra. El 911 no defrauda 🏔️',
    routeTitle: 'Sierra de Madrid',
    vehicleLabel: 'Porsche 911',
    createdAt: '2026-06-22T18:30:00+02:00',
    likes: ['laura@strada.es', 'miguel@strada.es', 'ana@strada.es'],
    comments: [
      {
        id: 'c1',
        authorEmail: 'laura@strada.es',
        authorName: 'Laura M.',
        text: 'Qué pasada de foto 🔥',
        createdAt: '2026-06-22T19:00:00+02:00',
      },
      {
        id: 'c2',
        authorEmail: 'miguel@strada.es',
        authorName: 'Miguel S.',
        text: 'Nos vemos en la próxima quedada',
        createdAt: '2026-06-22T19:15:00+02:00',
      },
    ],
    isSeed: true,
  },
  {
    id: 'post_seed_2',
    authorEmail: 'laura@strada.es',
    authorName: 'Laura M.',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    caption: 'Amanecer en Ronda antes de arrancar la ruta por los pueblos blancos',
    routeTitle: 'Ronda y pueblos blancos',
    vehicleLabel: 'Mazda MX-5',
    createdAt: '2026-06-20T07:45:00+02:00',
    likes: ['carlos@strada.es', 'ana@strada.es'],
    comments: [
      {
        id: 'c3',
        authorEmail: 'ana@strada.es',
        authorName: 'Ana G.',
        text: 'El MX-5 es perfecto para esas carreteras',
        createdAt: '2026-06-20T08:30:00+02:00',
      },
    ],
    isSeed: true,
  },
  {
    id: 'post_seed_3',
    authorEmail: 'miguel@strada.es',
    authorName: 'Miguel S.',
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
    caption: 'Subiendo al Puerto de Panderruedas. Niebla y curvas infinitas en los Picos 🇪🇸',
    routeTitle: 'Puerto de Panderruedas',
    vehicleLabel: 'BMW M340i',
    createdAt: '2026-06-18T11:20:00+02:00',
    likes: ['carlos@strada.es', 'laura@strada.es', 'miguel@strada.es', 'ana@strada.es', 'pedro@strada.es'],
    comments: [
      {
        id: 'c4',
        authorEmail: 'pedro@strada.es',
        authorName: 'Pedro L.',
        text: 'Respeto total, esa subida no es broma',
        createdAt: '2026-06-18T12:00:00+02:00',
      },
    ],
    isSeed: true,
  },
  {
    id: 'post_seed_5',
    authorEmail: 'pedro@strada.es',
    authorName: 'Pedro L.',
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
    caption: 'Domingo de curvas con la MT-07 por el Montseny. La carretera estaba seca y el grupo perfecto 🏍️',
    routeTitle: 'Curvas del Montseny',
    vehicleLabel: 'Yamaha MT-07',
    createdAt: '2026-06-24T10:15:00+02:00',
    likes: ['carlos@strada.es', 'laura@strada.es'],
    comments: [],
    isSeed: true,
  },
  {
    id: 'post_seed_4',
    authorEmail: 'ana@strada.es',
    authorName: 'Ana G.',
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=800&q=80',
    caption: 'Parada en Cabo de Gata. Costa volcánica + deportivo = combo ganador 🌊',
    routeTitle: 'Cabo de Gata',
    vehicleLabel: 'Audi TT RS',
    createdAt: '2026-06-15T16:00:00+02:00',
    likes: ['laura@strada.es'],
    comments: [],
    isSeed: true,
  },
];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(iso));
}
