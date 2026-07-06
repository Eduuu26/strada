const USERS_KEY = 'strada_users_v1';
const SESSION_KEY = 'strada_session_v1';
const CUSTOM_ROUTES_KEY = 'strada_routes_v1';
const SIGNUPS_KEY = 'strada_signups_v1';
const FEED_POSTS_KEY = 'strada_feed_v1';
const MEETUPS_KEY = 'strada_meetups_v1';
const JOIN_REQUESTS_KEY = 'strada_join_requests_v1';
const CHATS_KEY = 'strada_chats_v1';
const CLUBS_KEY = 'strada_clubs_v1';
const CLUB_INVITES_KEY = 'strada_club_invites_v1';
const CLUB_REQUESTS_KEY = 'strada_club_requests_v1';
const PLATFORM_ADMIN_EMAIL = 'administracion@strada.com';
const CLUB_SEARCH_RADIUS_KEY = 'strada_club_search_radius_v1';

function migrateLegacyStorage() {
  const pairs = [
    ['rutasapp_users_v3', USERS_KEY],
    ['rutasapp_session_v3', SESSION_KEY],
    ['rutasapp_custom_routes_v3', CUSTOM_ROUTES_KEY],
    ['rutasapp_signups_v3', SIGNUPS_KEY],
    ['rutasapp_feed_posts_v3', FEED_POSTS_KEY],
    ['rutasapp_meetups_v3', MEETUPS_KEY],
  ];
  pairs.forEach(([oldKey, newKey]) => {
    if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
    }
  });
}

function hideSplash() {
  const splash = document.getElementById('splash');
  const app = document.getElementById('appRoot');
  if (!splash || !app) return;
  splash.classList.add('out');
  app.classList.remove('hidden');
  setTimeout(() => splash.remove(), 500);
}

    const AVATAR_PRESETS = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    ];

    const ROUTE_FILTERS = [
      { id: 'all', label: 'Todas' },
      { id: 'motos', label: '🏍️ Motos' },
      { id: 'coches', label: '🚗 Coches' },
      { id: 'andalucia', label: 'Andalucía' },
      { id: 'madrid', label: 'Madrid' },
      { id: 'cantabria', label: 'Cantabria' },
      { id: 'facil', label: 'Fácil' },
      { id: 'exigente', label: 'Exigente' },
    ];


    const ROUTE_VEHICLE_MODES = [
      { id: 'mixto', label: 'Coches y motos', icon: '🚗🏍️' },
      { id: 'coches', label: 'Solo coches', icon: '🚗' },
      { id: 'motos', label: 'Solo motos', icon: '🏍️' },
    ];

    function routeVehicleModeLabel(mode) {
      return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.label || 'Coches y motos';
    }

    function routeVehicleModeIcon(mode) {
      return ROUTE_VEHICLE_MODES.find((m) => m.id === mode)?.icon || '🚗🏍️';
    }

    function isMotoVehicle(type) {
      return type === 'moto';
    }

    function vehicleMatchesRoute(route, type) {
      const mode = route.vehicleMode || 'mixto';
      if (mode === 'mixto') return true;
      if (mode === 'motos') return isMotoVehicle(type);
      return !isMotoVehicle(type);
    }

    let createRouteVehicleMode = 'mixto';

    const VEHICLES = [
      { id: 'coche', label: 'Coche', icon: '🚗' },
      { id: 'moto', label: 'Moto', icon: '🏍️' },
    ];

    const DEFAULT_VEHICLE_PHOTOS = {
      coche: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
      moto: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80',
    };

    const VEHICLE_PHOTO_PRESETS = [
      { id: 'car1', type: 'coche', url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', label: 'Deportivo' },
      { id: 'car2', type: 'coche', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80', label: 'Clásico' },
      { id: 'car3', type: 'coche', url: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=600&q=80', label: 'Compacto' },
      { id: 'car4', type: 'coche', url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80', label: 'Berlina' },
      { id: 'moto1', type: 'moto', url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80', label: 'Naked' },
      { id: 'moto2', type: 'moto', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80', label: 'Sport' },
      { id: 'moto3', type: 'moto', url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', label: 'Touring' },
    ];

    const SOCIAL_NETWORKS = [
      { id: 'instagram', label: 'Instagram', placeholder: 'usuario', prefix: '@' },
      { id: 'tiktok', label: 'TikTok', placeholder: 'usuario', prefix: '@' },
      { id: 'x', label: 'X', placeholder: 'usuario', prefix: '@' },
      { id: 'youtube', label: 'YouTube', placeholder: 'usuario o URL', prefix: '' },
    ];

    function emptySocials() {
      return { instagram: '', tiktok: '', x: '', youtube: '' };
    }

    function normalizeSocials(socials) {
      const base = emptySocials();
      if (!socials) return base;
      SOCIAL_NETWORKS.forEach((n) => { base[n.id] = (socials[n.id] || '').trim().replace(/^@/, ''); });
      return base;
    }

    function socialProfileUrl(network, handle) {
      const h = (handle || '').trim().replace(/^@/, '');
      if (!h) return null;
      if (network === 'instagram') return `https://instagram.com/${h}`;
      if (network === 'tiktok') return `https://tiktok.com/@${h}`;
      if (network === 'x') return `https://x.com/${h}`;
      if (network === 'youtube') return h.startsWith('http') ? h : `https://youtube.com/@${h}`;
      return null;
    }

    const titles = { explore: 'Explorar', routes: 'Rutas', events: 'Quedadas', clubs: 'Clubes', chats: 'Chats', drive: 'Conducir', profile: 'Perfil' };

    const seedPosts = [
      { id: 'post_seed_1', authorEmail: 'carlos@strada.es', authorName: 'Carlos R.', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', caption: 'Domingo de curvas en la Sierra. El 911 no defrauda 🏔️', routeTitle: 'Sierra de Madrid', vehicleLabel: 'Porsche 911', createdAt: '2026-06-22T18:30:00+02:00', likes: ['laura@strada.es', 'miguel@strada.es', 'ana@strada.es'], comments: [{ id: 'c1', authorEmail: 'laura@strada.es', authorName: 'Laura M.', text: 'Qué pasada de foto 🔥', createdAt: '2026-06-22T19:00:00+02:00' }, { id: 'c2', authorEmail: 'miguel@strada.es', authorName: 'Miguel S.', text: 'Nos vemos en la próxima quedada', createdAt: '2026-06-22T19:15:00+02:00' }], seed: true },
      { id: 'post_seed_2', authorEmail: 'laura@strada.es', authorName: 'Laura M.', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', caption: 'Amanecer en Ronda antes de arrancar la ruta por los pueblos blancos', routeTitle: 'Ronda y pueblos blancos', vehicleLabel: 'Mazda MX-5', createdAt: '2026-06-20T07:45:00+02:00', likes: ['carlos@strada.es', 'ana@strada.es'], comments: [{ id: 'c3', authorEmail: 'ana@strada.es', authorName: 'Ana G.', text: 'El MX-5 es perfecto para esas carreteras', createdAt: '2026-06-20T08:30:00+02:00' }], seed: true },
      { id: 'post_seed_3', authorEmail: 'miguel@strada.es', authorName: 'Miguel S.', imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80', caption: 'Subiendo al Puerto de Panderruedas. Niebla y curvas infinitas en los Picos 🇪🇸', routeTitle: 'Puerto de Panderruedas', vehicleLabel: 'BMW M340i', createdAt: '2026-06-18T11:20:00+02:00', likes: ['carlos@strada.es', 'laura@strada.es', 'miguel@strada.es', 'ana@strada.es', 'pedro@strada.es'], comments: [{ id: 'c4', authorEmail: 'pedro@strada.es', authorName: 'Pedro L.', text: 'Respeto total, esa subida no es broma', createdAt: '2026-06-18T12:00:00+02:00' }, { id: 'c5', authorEmail: 'carlos@strada.es', authorName: 'Carlos R.', text: '¿Cómo estaba el firme?', createdAt: '2026-06-18T12:30:00+02:00' }, { id: 'c6', authorEmail: 'miguel@strada.es', authorName: 'Miguel S.', text: 'Seco en la bajada, humedad arriba', createdAt: '2026-06-18T13:00:00+02:00' }], seed: true },
      { id: 'post_seed_5', authorEmail: 'pedro@strada.es', authorName: 'Pedro L.', imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', caption: 'Domingo de curvas con la MT-07 por el Montseny. La carretera estaba seca y el grupo perfecto 🏍️', routeTitle: 'Curvas del Montseny', vehicleLabel: 'Yamaha MT-07', createdAt: '2026-06-24T10:15:00+02:00', likes: ['carlos@strada.es', 'laura@strada.es'], comments: [], seed: true },
      { id: 'post_seed_4', authorEmail: 'ana@strada.es', authorName: 'Ana G.', imageUrl: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=800&q=80', caption: 'Parada en Cabo de Gata. Costa volcánica + deportivo = combo ganador 🌊', routeTitle: 'Cabo de Gata', vehicleLabel: 'Audi TT RS', createdAt: '2026-06-15T16:00:00+02:00', likes: ['laura@strada.es'], comments: [], seed: true },
    ];

    const DEFAULT_ROUTE_COVER = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';

    const seedRoutes = [
      { id: 'ronda', vehicleMode: 'mixto', title: 'Ronda y los pueblos blancos', region: 'Andalucía · Málaga', coverImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', desc: 'Ruta de montaña por carreteras sinuosas entre Ronda, Setenil y Grazalema. Curvas amplias, pueblos blancos colgados y paradas fotográficas en miradores. Ideal para un sábado tranquilo con buen firme.', km: 142, min: 210, level: 'media', stops: ['Ronda — Puente Nuevo', 'Setenil de las Bodegas', 'Grazalema'], meetingAt: '2026-07-26T09:00:00+02:00', meetingPoint: 'Puente Nuevo, Ronda', meetingLat: 36.7416, meetingLng: -5.1671, maxAttendees: 25, creatorName: 'Carlos R.', creatorEmail: 'carlos@strada.es', path: [[36.7416,-5.1671],[36.8628,-5.1775],[36.7656,-5.3661]], navInstruction: 'Salida hacia Setenil de las Bodegas', navNextKm: 12.4 },
      { id: 'picos', vehicleMode: 'mixto', title: 'Puerto de Panderruedas', region: 'Cantabria', coverImage: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80', desc: 'Subida exigente hacia los Picos de Europa con tramos de curvas cerradas y firme variable. Parada en el mirador del teleférico y ambiente de montaña. Recomendable ir temprano y con neumáticos en buen estado.', km: 68, min: 95, level: 'exigente', stops: ['Potes', 'Mirador del Cable', 'Fuente Dé'], meetingAt: '2026-08-02T08:00:00+02:00', meetingPoint: 'Plaza del Ayuntamiento, Potes', meetingLat: 43.1539, meetingLng: -4.6219, maxAttendees: 15, creatorName: 'Miguel S.', creatorEmail: 'miguel@strada.es', path: [[43.1539,-4.6219],[43.1882,-4.8124],[43.1953,-4.8128]], navInstruction: 'Sube por el puerto hacia Fuente Dé', navNextKm: 8.1 },
      { id: 'madrid', vehicleMode: 'mixto', title: 'Sierra de Madrid', region: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', desc: 'Salida rápida desde la capital por la M-607 hasta Navacerrada. Carreteras de curvas suaves, buen asfalto y parada en Miraflores. Perfecta para quedada dominical sin complicaciones.', km: 54, min: 75, level: 'fácil', stops: ['La Moraleja', 'Miraflores de la Sierra', 'Puerto de Navacerrada'], meetingAt: '2026-07-12T09:00:00+02:00', meetingPoint: 'Gasolinera La Moraleja (A-1)', meetingLat: 40.5186, meetingLng: -3.8267, maxAttendees: 20, creatorName: 'Laura M.', creatorEmail: 'laura@strada.es', path: [[40.5186,-3.8267],[40.8136,-3.7683],[40.7417,-4.0042]], navInstruction: 'Continúa por M-607 hacia Miraflores', navNextKm: 6.2 },
      { id: 'cabo-gata', vehicleMode: 'mixto', title: 'Cabo de Gata — costa volcánica', region: 'Andalucía · Almería', coverImage: 'https://images.unsplash.com/photo-1583121274602-3b283125eea1?w=800&q=80', desc: 'Ruta costera panorámica por el parque natural con tramos junto al mar y calas volcánicas. Poco tráfico fuera de temporada, parada en Los Genoveses y faro de Cabo de Gata. Ritmo relajado y muchas fotos.', km: 88, min: 120, level: 'fácil', stops: ['San José', 'Playa de los Genoveses', 'Faro Cabo de Gata'], meetingAt: '2026-08-09T10:00:00+02:00', meetingPoint: 'Centro de San José', meetingLat: 36.7631, meetingLng: -2.1067, maxAttendees: 30, creatorName: 'Ana G.', creatorEmail: 'ana@strada.es', path: [[36.7631,-2.1067],[36.7231,-2.0789],[36.7236,-2.1925]], navInstruction: 'Sigue por la costa hacia Los Genoveses', navNextKm: 4.8 },
      { id: 'montseny', vehicleMode: 'motos', title: 'Curvas del Montseny', region: 'Cataluña · Barcelona', coverImage: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80', desc: 'Carreteras de montaña entre Sant Celoni y el coll de Brull. Tramos técnicos entre bosque y curvas enlazadas. Quedada pensada para conductores que buscan ritmo sin salir de Barcelona.', km: 96, min: 130, level: 'media', stops: ['Sant Celoni', 'Coll de Brull', 'Vilanova de Sau'], meetingAt: '2026-07-20T08:30:00+02:00', meetingPoint: 'Estación de Sant Celoni', meetingLat: 41.6897, meetingLng: 2.4917, maxAttendees: 18, creatorName: 'Pedro L.', creatorEmail: 'pedro@strada.es', path: [[41.6897,2.4917],[41.7456,2.3124],[41.8123,2.2845]], navInstruction: 'Sube hacia el coll de Brull', navNextKm: 9.5 },
      { id: 'tramuntana', vehicleMode: 'motos', title: 'Sa Calobra y la Tramuntana', region: 'Islas Baleares · Mallorca', coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', desc: 'Descenso mítico hasta Sa Calobra con el famoso lazo de nudos. Carretera estrecha, vistas al Mediterráneo y parada obligatoria en el torrente. Ruta icónica para amantes de la conducción precisa.', km: 112, min: 165, level: 'exigente', stops: ['Sóller', 'Mirador de Sa Creueta', 'Sa Calobra'], meetingAt: '2026-09-06T07:00:00+02:00', meetingPoint: 'Puerto de Sóller', meetingLat: 39.7961, meetingLng: 2.6956, maxAttendees: 12, creatorName: 'Carlos R.', creatorEmail: 'carlos@strada.es', path: [[39.7961,2.6956],[39.8502,2.8012],[39.8521,2.8089]], navInstruction: 'Baja por la Ma-2141 hacia Sa Calobra', navNextKm: 14.2 },
      { id: 'guadarrama-moto', vehicleMode: 'motos', joinMode: 'request', title: 'Puerto de Navacerrada en moto', region: 'Madrid', coverImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80', desc: 'Subida clásica desde la sierra madrileña pensada para motos. Curvas de montaña, ritmo ágil y parada en el puerto.', km: 48, min: 70, level: 'media', stops: ['Miraflores de la Sierra', 'Puerto de Navacerrada'], meetingAt: '2026-07-19T08:00:00+02:00', meetingPoint: 'Miraflores — plaza principal', meetingLat: 40.8136, meetingLng: -3.7683, maxAttendees: 16, creatorName: 'Laura M.', creatorEmail: 'laura@strada.es', path: [[40.8136,-3.7683],[40.7417,-4.0042]], navInstruction: 'Sube hacia el puerto de Navacerrada', navNextKm: 7.5 },
      { id: 'n260-moto', vehicleMode: 'motos', joinMode: 'request', title: 'N-260 · Pirineo en moto', region: 'Huesca · Aragón', coverImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', desc: 'Tramos de curvas infinitas por el Pirineo aragonés. Ruta solo motos con paradas en miradores y gasolinera pactada a mitad de ruta.', km: 124, min: 150, level: 'exigente', stops: ['Aínsa', 'Escalona', 'Biescas'], meetingAt: '2026-08-16T09:00:00+02:00', meetingPoint: 'Plaza de Aínsa', meetingLat: 42.4156, meetingLng: 0.1401, maxAttendees: 12, creatorName: 'Miguel S.', creatorEmail: 'miguel@strada.es', path: [[42.4156,0.1401],[42.3889,0.0892],[42.6311,-0.2189]], navInstruction: 'Sigue la N-260 hacia Biescas', navNextKm: 11.0 },
    ];

    const seedMeetups = seedRoutes.filter((r) => r.meetingAt).map((r) => ({
      id: 'meetup_seed_' + r.id,
      routeId: r.id,
      title: r.title,
      desc: r.desc,
      meetingAt: r.meetingAt,
      meetingPoint: r.meetingPoint,
      meetingLat: r.meetingLat,
      meetingLng: r.meetingLng,
      maxAttendees: r.maxAttendees,
      vehicleMode: r.vehicleMode || 'mixto',
      coverImage: r.coverImage,
      creatorName: r.creatorName,
      creatorEmail: r.creatorEmail,
      createdAt: r.meetingAt,
      joinMode: r.joinMode || 'open',
      seed: true,
    }));

    let currentUser = null;
    let termsAccepted = false;
    let pendingAction = null;
    let joinRouteId = null;
    let joinMeetupId = null;
    let createMeetupVehicleMode = 'mixto';
    let createRouteJoinMode = 'open';
    let createMeetupJoinMode = 'open';
    let createClubVehicleMode = 'mixto';
    let pendingMeetupImage = null;
    let toastTimer = null;
    let driveMap = null;
    let driveMapLayers = [];
    let expandedComments = new Set();
    let pendingPostImage = null;
    let pendingRouteImage = null;
    let selectedSavedVehicleId = null;
    let editingVehicleId = null;
    let vehicleFormType = 'coche';
    let vehicleFormPhotoUrl = '';
    let routeSearchQuery = '';
    let routeFilterId = 'all';
    let lastFeedTap = { id: null, time: 0 };
    let activeChatId = null;
    let activeClubId = null;
    let userGeo = { lat: null, lng: null, status: 'idle' };
    const DEFAULT_GEO = { lat: 40.4168, lng: -3.7038 };
    const NEARBY_CLUBS_LIMIT = 12;
    const NEARBY_CLUBS_SPAIN_LIMIT = 30;
    const CLUB_SEARCH_RADIUS_OPTIONS = [
      { id: 'spain', label: 'Toda España', maxKm: null },
      { id: '25', label: '25 km', maxKm: 25 },
      { id: '50', label: '50 km', maxKm: 50 },
      { id: '100', label: '100 km', maxKm: 100 },
      { id: '250', label: '250 km', maxKm: 250 },
    ];
    let clubSearchRadiusId = 'spain';

    function getClubSearchRadiusId() {
      try {
        const stored = localStorage.getItem(CLUB_SEARCH_RADIUS_KEY);
        if (stored && CLUB_SEARCH_RADIUS_OPTIONS.some((o) => o.id === stored)) return stored;
      } catch { /* ignore */ }
      return clubSearchRadiusId;
    }
    function setClubSearchRadiusId(id) {
      clubSearchRadiusId = id;
      localStorage.setItem(CLUB_SEARCH_RADIUS_KEY, id);
    }
    function clubSearchRadiusMaxKm(id) {
      return CLUB_SEARCH_RADIUS_OPTIONS.find((o) => o.id === id)?.maxKm ?? null;
    }
    function clubSearchRadiusLabel(id) {
      return CLUB_SEARCH_RADIUS_OPTIONS.find((o) => o.id === id)?.label || 'Toda España';
    }
    function clubSearchSectionTitle(id) {
      return id === 'spain' ? 'Clubes en España' : `Clubes cerca (${clubSearchRadiusLabel(id)})`;
    }
    function clubSearchEmptyMessage(id) {
      if (id === 'spain') return 'No hay clubes con ubicación registrada en España.';
      return `No hay clubes en un radio de ${clubSearchRadiusLabel(id)} desde tu posición.`;
    }
    function renderClubSearchRadiusChips(activeId) {
      return `<div class="filter-chips club-radius-chips">${CLUB_SEARCH_RADIUS_OPTIONS.map((o) =>
        `<button type="button" class="filter-chip ${o.id === activeId ? 'active' : ''}" data-club-radius="${o.id}">${o.label}</button>`
      ).join('')}</div>`;
    }

    const SEED_CLUBS = [
      { id: 'club_seed_madrid', name: 'Madrid Sport Drivers', desc: 'Salidas dominicales por la sierra y curvas de montaña alrededor de Madrid.', vehicleMode: 'coches', creatorEmail: 'carlos@strada.es', creatorName: 'Carlos R.', memberEmails: ['carlos@strada.es', 'laura@strada.es'], createdAt: '2026-05-10T10:00:00+02:00', latitude: 40.4168, longitude: -3.7038, locationLabel: 'Madrid' },
      { id: 'club_seed_barcelona', name: 'Catalunya Road Club', desc: 'Rutas por el Montseny, Costa Brava y tramos de montaña en Cataluña.', vehicleMode: 'mixto', creatorEmail: 'pedro@strada.es', creatorName: 'Pedro L.', memberEmails: ['pedro@strada.es'], createdAt: '2026-05-12T11:00:00+02:00', latitude: 41.3851, longitude: 2.1734, locationLabel: 'Barcelona' },
      { id: 'club_seed_malaga', name: 'Costa del Sol Drivers', desc: 'Carreteras de montaña en Málaga, Ronda y la Axarquía. Ritmo tranquilo y buen ambiente.', vehicleMode: 'mixto', creatorEmail: 'ana@strada.es', creatorName: 'Ana G.', memberEmails: ['ana@strada.es', 'carlos@strada.es'], createdAt: '2026-05-15T09:30:00+02:00', latitude: 36.7213, longitude: -4.4214, locationLabel: 'Málaga' },
      { id: 'club_seed_valencia', name: 'Levante Moto Club', desc: 'Quedadas en moto por la Comunidad Valenciana. Curvas y costa mediterránea.', vehicleMode: 'motos', creatorEmail: 'miguel@strada.es', creatorName: 'Miguel S.', memberEmails: ['miguel@strada.es'], createdAt: '2026-05-18T08:00:00+02:00', latitude: 39.4699, longitude: -0.3763, locationLabel: 'Valencia' },
      { id: 'club_seed_bilbao', name: 'Euskadi Curvas', desc: 'Puertos de montaña y carreteras verdes del norte. Coches y motos bienvenidos.', vehicleMode: 'mixto', creatorEmail: 'laura@strada.es', creatorName: 'Laura M.', memberEmails: ['laura@strada.es'], createdAt: '2026-05-20T10:00:00+02:00', latitude: 43.263, longitude: -2.935, locationLabel: 'Bilbao' },
    ];

    function formatDuration(min) {
      const h = Math.floor(min / 60), m = min % 60;
      if (!h) return `${m} min`;
      if (!m) return `${h} h`;
      return `${h} h ${m} min`;
    }

    function hashPassword(pw) {
      let h = 0;
      for (let i = 0; i < pw.length; i++) h = ((h << 5) - h) + pw.charCodeAt(i);
      return 'd' + (h >>> 0).toString(16);
    }

    /** Escapa HTML para prevenir XSS al usar innerHTML. */
    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function safeImgUrl(url) {
      const u = String(url ?? '').trim();
      if (!u) return '';
      if (u.startsWith('data:image/')) return u.replace(/[\s"']/g, '');
      if (/^https?:\/\//i.test(u)) return u.replace(/[\s"']/g, '');
      return '';
    }

    function isStrongPassword(pw) {
      return pw.length >= 10 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
    }

    const LOGIN_ATTEMPTS_KEY = 'strada_login_attempts_v1';
    function assertLoginAllowed() {
      try {
        const record = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{"count":0}');
        if (record.lockedUntil && Date.now() < record.lockedUntil) {
          const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
          throw new Error(`Demasiados intentos. Espera ${mins} min.`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('Demasiados')) throw e;
      }
    }
    function recordFailedLogin() {
      const record = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '{"count":0}');
      const count = (record.count || 0) + 1;
      if (count >= 5) {
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 0, lockedUntil: Date.now() + 15 * 60 * 1000 }));
      } else {
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count }));
      }
    }
    function clearLoginAttempts() {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    }

    function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
    function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
    function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
    function setSession(user) { user ? localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email })) : localStorage.removeItem(SESSION_KEY); }
    function getCustomRoutes() { try { return JSON.parse(localStorage.getItem(CUSTOM_ROUTES_KEY) || '[]'); } catch { return []; } }
    function saveCustomRoutes(r) { localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(r)); }
    function getSignups() { try { return JSON.parse(localStorage.getItem(SIGNUPS_KEY) || '[]'); } catch { return []; } }
    function saveSignups(s) { localStorage.setItem(SIGNUPS_KEY, JSON.stringify(s)); }
    function getFeedPosts() { try { return JSON.parse(localStorage.getItem(FEED_POSTS_KEY) || '[]'); } catch { return []; } }
    function saveFeedPosts(p) { localStorage.setItem(FEED_POSTS_KEY, JSON.stringify(p)); }
    function getCustomMeetups() { try { return JSON.parse(localStorage.getItem(MEETUPS_KEY) || '[]'); } catch { return []; } }
    function saveCustomMeetups(m) { localStorage.setItem(MEETUPS_KEY, JSON.stringify(m)); }
    function getJoinRequests() { try { return JSON.parse(localStorage.getItem(JOIN_REQUESTS_KEY) || '[]'); } catch { return []; } }
    function saveJoinRequests(r) { localStorage.setItem(JOIN_REQUESTS_KEY, JSON.stringify(r)); }
    function isJoinOpen(target) { return (target?.joinMode || 'open') === 'open'; }
    function joinModeShort(target) {
      return isJoinOpen(target) ? '🌐 Abierta' : '🔒 Privada';
    }
    function joinModeDetail(target) {
      return isJoinOpen(target)
        ? '🌐 Abierta — cualquiera puede apuntarse'
        : '🔒 Privada — solicita unirte y el organizador aprueba';
    }
    function getUserPendingJoinRequest({ meetupId, routeId }) {
      if (!currentUser) return null;
      return getJoinRequests().find((r) =>
        r.status === 'pending' &&
        r.userEmail === currentUser.email &&
        (meetupId ? r.meetupId === meetupId : r.routeId === routeId && !r.meetupId),
      );
    }
    function getPendingRequestsForMeetup(meetupId) {
      return getJoinRequests().filter((r) => r.meetupId === meetupId && r.status === 'pending');
    }
    function getPendingRequestsForRoute(routeId) {
      return getJoinRequests().filter((r) => r.routeId === routeId && !r.meetupId && r.status === 'pending');
    }
    function meetupJoinButtonLabel(meetup, signups) {
      const signedUp = currentUser && signups.some((s) => s.userEmail === currentUser.email);
      const isFull = meetup.maxAttendees && signups.length >= meetup.maxAttendees;
      const mySignup = signedUp ? signups.find((s) => s.userEmail === currentUser.email) : null;
      const pending = getUserPendingJoinRequest({ meetupId: meetup.id });
      if (!currentUser) return 'Inicia sesión para apuntarte';
      if (signedUp) return `Cancelar apunte (${vehicleName(mySignup.vehicleType)} · ${mySignup.vehicleLabel})`;
      if (!isJoinOpen(meetup)) {
        if (pending) return 'Cancelar solicitud';
        return isFull ? 'Quedada completa' : 'Solicitar unirse — elegir vehículo';
      }
      return isFull ? 'Quedada completa' : 'Apuntarme — elegir vehículo';
    }
    function routeJoinButtonLabel(route, signups) {
      const signedUp = currentUser && signups.some((s) => s.userEmail === currentUser.email);
      const isFull = route.maxAttendees && signups.length >= route.maxAttendees;
      const pending = getUserPendingJoinRequest({ routeId: route.id });
      if (!currentUser) return 'Inicia sesión para apuntarte';
      if (signedUp) return 'Cancelar apunte';
      if (!isJoinOpen(route)) {
        if (pending) return 'Cancelar solicitud';
        return isFull ? 'Ruta completa' : 'Solicitar unirse — elegir vehículo';
      }
      return isFull ? 'Ruta completa' : 'Apuntarme — elegir vehículo';
    }
    function renderPendingRequestsBlock({ meetupId, routeId, creatorEmail }) {
      if (!currentUser || currentUser.email !== creatorEmail) return '';
      const pending = meetupId ? getPendingRequestsForMeetup(meetupId) : getPendingRequestsForRoute(routeId);
      if (!pending.length) return '';
      return `<p class="section-title">Solicitudes pendientes (${pending.length})</p>
        ${pending.map((r) => `<div class="join-request-row">
          <div><strong>${r.userName}</strong><br><span class="hero-text" style="font-size:0.82rem">${vehicleName(r.vehicleType)} · ${r.vehicleLabel}</span></div>
          <div class="nav-row" style="margin:0">
            <button type="button" class="btn btn-primary btn-sm btn-approve-request" data-request-id="${r.id}">Aceptar</button>
            <button type="button" class="btn btn-secondary btn-sm btn-reject-request" data-request-id="${r.id}">Rechazar</button>
          </div>
        </div>`).join('')}`;
    }
    function bindPendingRequestActions() {
      document.querySelectorAll('.btn-approve-request').forEach((btn) => {
        btn.onclick = () => approveJoinRequest(btn.dataset.requestId);
      });
      document.querySelectorAll('.btn-reject-request').forEach((btn) => {
        btn.onclick = () => rejectJoinRequest(btn.dataset.requestId);
      });
    }
    function approveJoinRequest(requestId) {
      const req = getJoinRequests().find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return;
      const meetup = req.meetupId ? getMeetup(req.meetupId) : null;
      const route = req.routeId ? getRoute(req.routeId) : null;
      const creatorEmail = meetup?.creatorEmail || route?.creatorEmail;
      if (!currentUser || currentUser.email !== creatorEmail) {
        showToast('No puedes gestionar esta solicitud');
        return;
      }
      const signups = getSignups();
      const already = req.meetupId
        ? signups.some((s) => s.meetupId === req.meetupId && s.userEmail === req.userEmail)
        : signups.some((s) => s.routeId === req.routeId && s.userEmail === req.userEmail);
      if (!already) {
        saveSignups([...signups, {
          id: 'su_' + Date.now(),
          meetupId: req.meetupId,
          routeId: req.routeId,
          userEmail: req.userEmail,
          userName: req.userName,
          vehicleType: req.vehicleType,
          vehicleLabel: req.vehicleLabel,
          joinedAt: new Date().toISOString(),
        }]);
        if (req.meetupId && meetup) {
          ensureMeetupChat(meetup);
          syncChatParticipant({ meetupId: req.meetupId, routeId: meetup.routeId, title: meetup.title, creatorEmail: meetup.creatorEmail }, req.userEmail, req.userName, true);
        } else if (req.routeId && route) {
          ensureRouteChat(route);
          syncChatParticipant({ routeId: req.routeId, title: route.title, creatorEmail: route.creatorEmail }, req.userEmail, req.userName, true);
        }
      }
      saveJoinRequests(getJoinRequests().map((r) =>
        r.id === requestId ? { ...r, status: 'approved', reviewedAt: new Date().toISOString() } : r,
      ));
      showToast(`${req.userName} aceptado/a`, 'success');
      if (req.meetupId) openMeetupDetail(req.meetupId);
      else if (req.routeId) openDetail(req.routeId, { routeOnly: true });
      renderRoutes();
    }
    function rejectJoinRequest(requestId) {
      const req = getJoinRequests().find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return;
      const meetup = req.meetupId ? getMeetup(req.meetupId) : null;
      const route = req.routeId ? getRoute(req.routeId) : null;
      const creatorEmail = meetup?.creatorEmail || route?.creatorEmail;
      if (!currentUser || currentUser.email !== creatorEmail) {
        showToast('No puedes gestionar esta solicitud');
        return;
      }
      saveJoinRequests(getJoinRequests().map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString() } : r,
      ));
      showToast('Solicitud rechazada');
      if (req.meetupId) openMeetupDetail(req.meetupId);
      else if (req.routeId) openDetail(req.routeId, { routeOnly: true });
      renderRoutes();
    }
    function cancelUserJoinRequest({ meetupId, routeId }) {
      saveJoinRequests(getJoinRequests().filter((r) =>
        !(r.status === 'pending' && r.userEmail === currentUser.email &&
          (meetupId ? r.meetupId === meetupId : r.routeId === routeId && !r.meetupId)),
      ));
    }
    function setJoinModalRequestMode(isRequest) {
      document.getElementById('confirmJoin').textContent = isRequest ? 'Enviar solicitud' : 'Confirmar apunte';
    }

    function getChats() { try { return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]'); } catch { return []; } }
    function saveChats(c) { localStorage.setItem(CHATS_KEY, JSON.stringify(c)); }
    function chatIdForMeetup(meetupId) { return `chat_meetup_${meetupId}`; }
    function chatIdForRoute(routeId) { return `chat_route_${routeId}`; }
    function chatIdForClub(clubId) { return `chat_club_${clubId}`; }

    function systemChatMessage(text) {
      return { id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), type: 'system', text, createdAt: new Date().toISOString() };
    }

    function ensureMeetupChat(meetup) {
      const id = chatIdForMeetup(meetup.id);
      const chats = getChats();
      if (chats.some((c) => c.id === id)) return chats.find((c) => c.id === id);
      const chat = {
        id,
        meetupId: meetup.id,
        routeId: meetup.routeId,
        title: meetup.title,
        organizerEmail: meetup.creatorEmail,
        participantEmails: meetup.creatorEmail ? [meetup.creatorEmail] : [],
        messages: [systemChatMessage('Chat del grupo creado. Aquí coordináis la quedada con el resto de participantes.')],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveChats([chat, ...chats]);
      return chat;
    }

    function ensureRouteChat(route) {
      const id = chatIdForRoute(route.id);
      const chats = getChats();
      if (chats.some((c) => c.id === id)) return chats.find((c) => c.id === id);
      const chat = {
        id,
        routeId: route.id,
        title: route.title,
        organizerEmail: route.creatorEmail,
        participantEmails: route.creatorEmail ? [route.creatorEmail] : [],
        messages: [systemChatMessage('Chat de la ruta creado. Aquí habláis con el resto de conductores apuntados.')],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveChats([chat, ...chats]);
      return chat;
    }

    function ensureClubChat(club) {
      const id = chatIdForClub(club.id);
      let chats = getChats();
      let idx = chats.findIndex((c) => c.id === id);
      if (idx < 0) {
        const chat = {
          id,
          clubId: club.id,
          title: club.name,
          organizerEmail: club.creatorEmail,
          participantEmails: [...club.memberEmails],
          messages: [systemChatMessage('Chat del club creado. Aquí habláis con el resto de miembros.')],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveChats([chat, ...chats]);
        return chat;
      }
      const chat = chats[idx];
      let participantEmails = [...chat.participantEmails];
      let changed = false;
      for (const email of club.memberEmails) {
        if (!participantEmails.some((e) => e.toLowerCase() === email.toLowerCase())) {
          participantEmails.push(email);
          changed = true;
        }
      }
      if (changed) {
        chats[idx] = { ...chat, participantEmails, updatedAt: new Date().toISOString() };
        saveChats(chats);
      }
      return chats[idx];
    }

    function syncClubParticipant(club, email, userName, joined) {
      ensureClubChat(club);
      const id = chatIdForClub(club.id);
      let chats = getChats();
      const idx = chats.findIndex((c) => c.id === id);
      if (idx < 0) return;
      const chat = chats[idx];
      const key = email.toLowerCase();
      const has = chat.participantEmails.some((e) => e.toLowerCase() === key);
      if (joined && has) return;
      if (!joined && !has) return;
      const messages = [...chat.messages];
      if (userName) messages.push(systemChatMessage(joined ? `${userName} se unió al club.` : `${userName} abandonó el club.`));
      const participantEmails = joined
        ? [...chat.participantEmails, email]
        : chat.participantEmails.filter((e) => e.toLowerCase() !== key);
      chats[idx] = { ...chat, participantEmails, messages, updatedAt: new Date().toISOString() };
      saveChats(chats);
    }

    function syncUserClubChats() {
      if (!currentUser) return;
      getClubs()
        .filter((club) => isClubMember(club, currentUser.email))
        .forEach((club) => ensureClubChat(club));
    }

    function syncChatParticipant({ meetupId, routeId, title, creatorEmail }, email, userName, joined) {
      const id = meetupId ? chatIdForMeetup(meetupId) : chatIdForRoute(routeId);
      let chats = getChats();
      let idx = chats.findIndex((c) => c.id === id);
      if (idx < 0) {
        if (meetupId) ensureMeetupChat(getMeetup(meetupId) || { id: meetupId, title, routeId, creatorEmail });
        else ensureRouteChat(getRoute(routeId) || { id: routeId, title, creatorEmail });
        chats = getChats();
        idx = chats.findIndex((c) => c.id === id);
      }
      if (idx < 0) return;
      const chat = chats[idx];
      const key = email.toLowerCase();
      const has = chat.participantEmails.some((e) => e.toLowerCase() === key);
      if (joined && has) return;
      if (!joined && !has) return;
      const messages = [...chat.messages];
      if (userName) messages.push(systemChatMessage(joined ? `${userName} se unió al grupo.` : `${userName} abandonó el grupo.`));
      const participantEmails = joined
        ? [...chat.participantEmails, email]
        : chat.participantEmails.filter((e) => e.toLowerCase() !== key);
      chats[idx] = { ...chat, participantEmails, messages, updatedAt: new Date().toISOString() };
      saveChats(chats);
    }

    function getUserChats(email) {
      const key = email.toLowerCase();
      return getChats()
        .filter((c) => c.participantEmails.some((e) => e.toLowerCase() === key))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    function getChat(id) { return getChats().find((c) => c.id === id); }
    function getChatForMeetup(meetupId) { return getChats().find((c) => c.meetupId === meetupId); }
    function getChatForClub(clubId) { return getChats().find((c) => c.clubId === clubId); }

    function sendChatMessage(chatId, text) {
      if (!currentUser || !text.trim()) return false;
      const chats = getChats();
      const idx = chats.findIndex((c) => c.id === chatId);
      if (idx < 0) return false;
      const chat = chats[idx];
      if (!chat.participantEmails.some((e) => e.toLowerCase() === currentUser.email.toLowerCase())) return false;
      chats[idx] = {
        ...chat,
        messages: [...chat.messages, {
          id: 'msg_' + Date.now(),
          type: 'user',
          text: text.trim(),
          authorEmail: currentUser.email,
          authorName: currentUser.name,
          createdAt: new Date().toISOString(),
        }],
        updatedAt: new Date().toISOString(),
      };
      saveChats(chats);
      return true;
    }

    function formatChatTime(iso) {
      return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    }

    function formatMsgTime(iso) {
      return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    }

    function renderChatsPanel() {
      const list = document.getElementById('chatsList');
      if (!list) return;
      if (!currentUser) {
        list.innerHTML = '<div class="empty-state">Inicia sesión para ver tus chats de club, ruta y quedadas.</div>';
        return;
      }
      const chats = getUserChats(currentUser.email);
      if (!chats.length) {
        list.innerHTML = '<div class="empty-state">Aún no tienes chats. Únete a un club o apúntate a una quedada o ruta y se creará el grupo automáticamente.</div>';
        return;
      }
      list.innerHTML = chats.map((chat) => {
        const last = chat.messages[chat.messages.length - 1];
        const preview = last?.type === 'system' ? escapeHtml(last.text) : `${escapeHtml(last?.authorName || '')}: ${escapeHtml(last?.text || '')}`;
        return `<button type="button" class="chat-list-item" data-chat-id="${escapeHtml(chat.id)}">
          <strong>${escapeHtml(chat.title)}</strong>
          <span>${preview}</span>
          <span class="chat-list-meta">${chat.participantEmails.length} participantes · ${formatChatTime(chat.updatedAt)}</span>
        </button>`;
      }).join('');
      list.querySelectorAll('[data-chat-id]').forEach((btn) => {
        btn.onclick = () => openChatThread(btn.dataset.chatId);
      });
    }

    function openChatThread(chatId) {
      const chat = getChat(chatId);
      if (!chat) return;
      activeChatId = chatId;
      closeModals();
      document.getElementById('mainShell').classList.add('hidden');
      document.getElementById('chatShell').classList.add('open');
      renderChatThread();
    }

    function renderChatThread() {
      const chat = getChat(activeChatId);
      if (!chat) return closeChatThread();
      const isMember = currentUser && chat.participantEmails.some((e) => e.toLowerCase() === currentUser.email.toLowerCase());
      document.getElementById('chatThreadTitle').textContent = chat.title;
      document.getElementById('chatMessages').innerHTML = chat.messages.map((msg) => {
        if (msg.type === 'system') return `<div class="chat-system">${escapeHtml(msg.text)}</div>`;
        const mine = msg.authorEmail === currentUser?.email;
        return `<div class="chat-msg ${mine ? 'mine' : ''}">
          ${!mine ? `<span class="chat-author">${escapeHtml(msg.authorName)}</span>` : ''}
          <span class="chat-text">${escapeHtml(msg.text)}</span>
          <span class="chat-time">${formatMsgTime(msg.createdAt)}</span>
        </div>`;
      }).join('');
      const composer = document.getElementById('chatComposer');
      composer.hidden = !isMember;
      document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    function closeChatThread() {
      activeChatId = null;
      document.getElementById('chatShell').classList.remove('open');
      document.getElementById('mainShell').classList.remove('hidden');
    }

    function saveSocialsFromForm() {
      if (!currentUser) return;
      const socials = emptySocials();
      SOCIAL_NETWORKS.forEach((n) => {
        socials[n.id] = (document.getElementById('social_' + n.id)?.value || '').trim().replace(/^@/, '');
      });
      currentUser.socials = socials;
      syncCurrentUserToStorage();
      showToast('Redes guardadas', 'success');
    }

    function normalizeClubEmail(email) { return (email || '').trim().toLowerCase(); }
    function getClubs() {
      if (window.StradaCloud?.isActive()) return window.StradaCloud.getClubs();
      try { return JSON.parse(localStorage.getItem(CLUBS_KEY) || '[]'); } catch { return []; }
    }
    function saveClubs(c) {
      if (window.StradaCloud?.isActive()) {
        const prev = window.StradaCloud.getClubs();
        window.StradaCloud.setClubs(c);
        c.forEach((club) => { void window.StradaCloud.persistClub(club); });
        prev.filter((p) => !c.some((x) => x.id === p.id)).forEach((p) => { void window.StradaCloud.deleteClub(p.id); });
        return;
      }
      localStorage.setItem(CLUBS_KEY, JSON.stringify(c));
    }
    function seedClubsIfEmpty() {
      if (window.StradaCloud?.isConfigured()) return;
      if (getClubs().length) return;
      saveClubs(SEED_CLUBS);
    }
    function distanceKm(lat1, lng1, lat2, lng2) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    function formatDistanceKm(km) {
      if (km < 1) return `${Math.round(km * 1000)} m`;
      if (km < 10) return `${km.toFixed(1)} km`;
      return `${Math.round(km)} km`;
    }
    function clubsNearLocation(lat, lng, excludeEmail, maxKm) {
      const radiusKm = maxKm === undefined ? clubSearchRadiusMaxKm(getClubSearchRadiusId()) : maxKm;
      const limit = radiusKm == null ? NEARBY_CLUBS_SPAIN_LIMIT : NEARBY_CLUBS_LIMIT;
      return getClubs()
        .filter((c) => c.latitude != null && c.longitude != null)
        .filter((c) => !excludeEmail || !isClubMember(c, excludeEmail))
        .map((c) => ({ ...c, distanceKm: distanceKm(lat, lng, c.latitude, c.longitude) }))
        .filter((c) => radiusKm == null || c.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit);
    }
    function requestUserLocation(onDone) {
      if (!navigator.geolocation) {
        userGeo = { lat: DEFAULT_GEO.lat, lng: DEFAULT_GEO.lng, status: 'denied' };
        onDone?.();
        return;
      }
      userGeo.status = 'loading';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userGeo = { lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'ready' };
          onDone?.();
        },
        () => {
          userGeo = { lat: DEFAULT_GEO.lat, lng: DEFAULT_GEO.lng, status: 'denied' };
          onDone?.();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
      );
    }
    function clubDistanceLabel(club) {
      if (userGeo.lat == null || club.latitude == null) return '';
      const km = distanceKm(userGeo.lat, userGeo.lng, club.latitude, club.longitude);
      return formatDistanceKm(km);
    }
    function getClubInvites() {
      if (window.StradaCloud?.isActive()) return window.StradaCloud.getClubInvites();
      try { return JSON.parse(localStorage.getItem(CLUB_INVITES_KEY) || '[]'); } catch { return []; }
    }
    function saveClubInvites(i) {
      if (window.StradaCloud?.isActive()) {
        window.StradaCloud.setClubInvites(i);
        i.forEach((inv) => { void window.StradaCloud.persistClubInvite(inv); });
        return;
      }
      localStorage.setItem(CLUB_INVITES_KEY, JSON.stringify(i));
    }
    function getClubRequests() {
      if (window.StradaCloud?.isActive()) return window.StradaCloud.getClubRequests();
      try { return JSON.parse(localStorage.getItem(CLUB_REQUESTS_KEY) || '[]'); } catch { return []; }
    }
    function saveClubRequests(r) {
      if (window.StradaCloud?.isActive()) {
        window.StradaCloud.setClubRequests(r);
        r.forEach((req) => { void window.StradaCloud.persistClubRequest(req); });
        return;
      }
      localStorage.setItem(CLUB_REQUESTS_KEY, JSON.stringify(r));
    }
    function isRetainedClubCreationRequest(request) {
      if (request.status === 'pending') return true;
      if (request.status === 'approved' && request.approvalUnread) return true;
      return false;
    }
    function purgeResolvedClubRequests() {
      const all = window.StradaCloud?.isActive()
        ? window.StradaCloud.getClubRequests()
        : (() => { try { return JSON.parse(localStorage.getItem(CLUB_REQUESTS_KEY) || '[]'); } catch { return []; } })();
      const retained = all.filter(isRetainedClubCreationRequest);
      if (retained.length === all.length) return;
      if (window.StradaCloud?.isActive()) {
        window.StradaCloud.setClubRequests(retained);
        return;
      }
      localStorage.setItem(CLUB_REQUESTS_KEY, JSON.stringify(retained));
    }
    function removeClubRequest(requestId) {
      const next = getClubRequests().filter((r) => r.id !== requestId);
      if (window.StradaCloud?.isActive()) {
        window.StradaCloud.setClubRequests(next);
        void window.StradaCloud.deleteClubRequest(requestId);
        return;
      }
      localStorage.setItem(CLUB_REQUESTS_KEY, JSON.stringify(next));
    }
    function getPlatformAdminEmail() {
      return normalizeClubEmail(PLATFORM_ADMIN_EMAIL);
    }
    function isPlatformAdmin(email) {
      return normalizeClubEmail(email) === getPlatformAdminEmail();
    }
    const STRADA_EMAIL_API = (window.STRADA_CONFIG?.emailApi || window.STRADA_EMAIL_API || 'http://127.0.0.1:8788');
    function postClubEmail(path, body) {
      if (window.StradaCloud?.isActive()) {
        return window.StradaCloud.postEmail(path, body).then((r) => {
          if (!r.ok) console.warn('[Strada email]', r.error);
          return r;
        });
      }
      console.warn('[Strada email] Configura Supabase en assets/js/strada-config.js para enviar correos.');
      return Promise.resolve({ ok: false });
    }
    function clubRequestEmailPayload(request) {
      return {
        id: request.id,
        name: request.name,
        description: request.description,
        vehicleMode: request.vehicleMode,
        locationLabel: request.locationLabel,
        requesterName: request.requesterName,
        requesterEmail: request.requesterEmail,
        createdAt: request.createdAt,
      };
    }
    function notifyClubRequestSubmittedEmail(request) {
      postClubEmail('/api/email/club-request', { request: clubRequestEmailPayload(request) });
    }
    function notifyClubRequestApprovedEmail(request, clubId) {
      postClubEmail('/api/email/club-decision', {
        decision: 'approved',
        request: clubRequestEmailPayload(request),
        clubId,
      });
    }
    function notifyClubRequestRejectedEmail(request) {
      postClubEmail('/api/email/club-decision', {
        decision: 'rejected',
        request: clubRequestEmailPayload(request),
      });
    }
    function hasPendingClubCreationRequest(requesterEmail) {
      const key = normalizeClubEmail(requesterEmail);
      return getClubRequests().some((r) => normalizeClubEmail(r.requesterEmail) === key && r.status === 'pending');
    }
    function getUserClubCreationRequests(email) {
      const key = normalizeClubEmail(email);
      return getClubRequests().filter((r) => normalizeClubEmail(r.requesterEmail) === key && r.status === 'pending');
    }
    function getUnreadClubApprovalNotifications(email) {
      const key = normalizeClubEmail(email);
      return getClubRequests().filter((r) =>
        normalizeClubEmail(r.requesterEmail) === key && r.status === 'approved' && r.approvalUnread);
    }
    function markClubApprovalSeen(requestId) {
      if (!currentUser) return;
      removeClubRequest(requestId);
    }
    function renderClubApprovalNotificationsHtml() {
      if (!currentUser) return '';
      return getUnreadClubApprovalNotifications(currentUser.email).map((r) => `
        <div class="club-approval-notice" data-request-id="${r.id}">
          <strong>¡Club aprobado!</strong>
          <p class="hero-text" style="font-size:0.82rem;margin-top:4px">El equipo de Strada ha aceptado tu petición. El club «${r.name}» ya está creado y eres su fundador.</p>
          <div class="nav-row" style="margin-top:8px">
            ${r.createdClubId ? `<button type="button" class="btn btn-primary btn-sm btn-club-approval-view" data-club-id="${r.createdClubId}" data-request-id="${r.id}">Ver club</button>` : ''}
            <button type="button" class="btn btn-secondary btn-sm btn-club-approval-dismiss" data-request-id="${r.id}">Entendido</button>
          </div>
        </div>`).join('');
    }
    function bindClubApprovalNotifications(root) {
      if (!root) return;
      root.querySelectorAll('.btn-club-approval-view').forEach((btn) => {
        btn.onclick = () => {
          markClubApprovalSeen(btn.dataset.requestId);
          openClubDetail(btn.dataset.clubId);
          renderClubsPanel();
          renderProfile();
        };
      });
      root.querySelectorAll('.btn-club-approval-dismiss').forEach((btn) => {
        btn.onclick = () => {
          markClubApprovalSeen(btn.dataset.requestId);
          showToast('Notificación archivada');
          renderClubsPanel();
          renderProfile();
        };
      });
    }
    function getPendingClubCreationRequests() {
      if (!currentUser || !isPlatformAdmin(currentUser.email)) return [];
      return getClubRequests().filter((r) => r.status === 'pending');
    }
    function renderAdminClubRequestsHtml(buttonClass = 'btn-approve-club-req') {
      if (!currentUser || !isPlatformAdmin(currentUser.email)) return '';
      const adminPending = getPendingClubCreationRequests();
      if (!adminPending.length) return '';
      const rejectClass = buttonClass === 'btn-approve-club-req-profile'
        ? 'btn-reject-club-req-profile'
        : 'btn-reject-club-req';
      return `<p class="section-title">Solicitudes de nuevos clubes (${adminPending.length})</p>${adminPending.map((r) => `
        <div class="club-invite-card">
          <strong>${r.name}</strong>
          <p class="hero-text" style="font-size:0.82rem">Solicita ${r.requesterName} · ${routeVehicleModeLabel(r.vehicleMode)}</p>
          <p class="hero-text" style="font-size:0.82rem;margin-top:4px">${r.description}</p>
          <div class="nav-row" style="margin-top:8px">
            <button type="button" class="btn btn-primary btn-sm ${buttonClass}" data-request-id="${r.id}">Aprobar y crear</button>
            <button type="button" class="btn btn-secondary btn-sm ${rejectClass}" data-request-id="${r.id}">Rechazar</button>
          </div>
        </div>`).join('')}`;
    }
    function notifyUnreadClubApprovals() {
      if (!currentUser) return;
      const unread = getUnreadClubApprovalNotifications(currentUser.email);
      if (unread.length) {
        showToast(`¡Tu club «${unread[0].name}» ha sido aprobado!`, 'success');
      }
    }
    function submitClubCreationRequest(input) {
      if (!currentUser) return { ok: false, error: 'Inicia sesión.' };
      if (!input.name?.trim() || !input.description?.trim()) {
        return { ok: false, error: 'Completa nombre y descripción.' };
      }
      if (hasPendingClubCreationRequest(currentUser.email)) {
        return { ok: false, error: 'Ya tienes una solicitud de club pendiente de revisión.' };
      }
      const request = {
        id: 'creq_' + Date.now(),
        name: input.name.trim(),
        description: input.description.trim(),
        vehicleMode: input.vehicleMode || 'mixto',
        latitude: input.latitude,
        longitude: input.longitude,
        locationLabel: input.locationLabel || 'Tu zona',
        requesterEmail: currentUser.email,
        requesterName: currentUser.name,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewerEmail: getPlatformAdminEmail(),
      };
      saveClubRequests([request, ...getClubRequests()]);
      notifyClubRequestSubmittedEmail(request);
      return { ok: true, request };
    }
    function approveClubCreationRequest(requestId) {
      if (!currentUser || !isPlatformAdmin(currentUser.email)) return null;
      const requests = getClubRequests();
      const req = requests.find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return null;
      const club = createClubRecord({
        name: req.name,
        description: req.description,
        vehicleMode: req.vehicleMode,
        latitude: req.latitude,
        longitude: req.longitude,
        locationLabel: req.locationLabel,
      }, { email: req.requesterEmail, name: req.requesterName });
      if (!club) return null;
      saveClubRequests(requests.map((r) => r.id === requestId ? {
        ...r, status: 'approved', reviewedAt: new Date().toISOString(),
        reviewedByEmail: currentUser.email, createdClubId: club.id, approvalUnread: true,
      } : r));
      notifyClubRequestApprovedEmail(req, club.id);
      return club;
    }
    function rejectClubCreationRequest(requestId) {
      if (!currentUser || !isPlatformAdmin(currentUser.email)) return false;
      const requests = getClubRequests();
      const req = requests.find((r) => r.id === requestId);
      if (!req || req.status !== 'pending') return false;
      removeClubRequest(requestId);
      notifyClubRequestRejectedEmail(req);
      return true;
    }
    function deleteClubRecord(clubId) {
      if (!currentUser) return false;
      const club = getClub(clubId);
      if (!club || !isClubCreator(club, currentUser.email)) return false;
      saveClubs(getClubs().filter((c) => c.id !== clubId));
      saveClubInvites(getClubInvites().filter((inv) => inv.clubId !== clubId));
      saveChats(getChats().filter((c) => c.clubId !== clubId));
      return true;
    }
    function getClub(id) { return getClubs().find((c) => c.id === id); }
    function isClubMember(club, email) {
      const key = normalizeClubEmail(email);
      return club.memberEmails.some((e) => normalizeClubEmail(e) === key);
    }
    function isClubCreator(club, email) {
      return normalizeClubEmail(club.creatorEmail) === normalizeClubEmail(email);
    }
    function findUserByEmail(email) {
      const key = normalizeClubEmail(email);
      if (window.StradaCloud?.isActive()) {
        const sbUser = window.StradaCloud.getUser();
        if (sbUser && normalizeClubEmail(sbUser.email) === key) {
          return { email: sbUser.email, name: sbUser.name, avatarUrl: sbUser.avatarUrl, vehicles: sbUser.vehicles || [] };
        }
        return null;
      }
      const found = getUsers().find((u) => normalizeClubEmail(u.email) === key);
      return found
        ? { email: found.email, name: found.name, avatarUrl: found.avatarUrl || null, vehicles: normalizeUserVehicles(found.vehicles) }
        : null;
    }

    async function findUserByEmailAsync(email) {
      const key = normalizeClubEmail(email);
      if (window.StradaCloud?.isActive()) {
        const row = await window.StradaCloud.lookupProfileForInvite(key);
        if (row) return { email: row.email, name: row.name, avatarUrl: null, vehicles: [] };
        return null;
      }
      return findUserByEmail(email);
    }

    function vehiclePhotoUrl(vehicle) {
      const type = coerceVehicleType(vehicle.type);
      return (vehicle.photoUrl || '').trim() || DEFAULT_VEHICLE_PHOTOS[type] || DEFAULT_VEHICLE_PHOTOS.coche;
    }

    function memberVehiclesForClub(vehicles, clubVehicleMode) {
      const list = (vehicles || []).filter((v) => vehicleMatchesRoute({ vehicleMode: clubVehicleMode || 'mixto' }, v.type));
      return [...list].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
    }

    function renderClubMembersGallery(club) {
      return `<div class="club-members-grid">${club.memberEmails.map((email) => {
        const member = findUserByEmail(email) || { email, name: email, avatarUrl: null, vehicles: [] };
        const isOwner = normalizeClubEmail(email) === normalizeClubEmail(club.creatorEmail);
        const vehicles = memberVehiclesForClub(member.vehicles, club.vehicleMode);
        const avatar = member.avatarUrl
          ? `<img src="${member.avatarUrl}" alt="" class="club-member-avatar">`
          : `<span class="club-member-avatar club-member-avatar--placeholder">${(member.name || email).charAt(0).toUpperCase()}</span>`;
        const vehiclesHtml = vehicles.length
          ? `<div class="club-member-vehicles">${vehicles.map((v) => `
              <div class="club-vehicle-card">
                <img src="${vehiclePhotoUrl(v)}" alt="${vehicleDisplayTitle(v)}" loading="lazy">
                <div class="club-vehicle-info">
                  <span class="club-vehicle-icon">${vehicleIcon(v.type)}</span>
                  <div><strong>${vehicleDisplayTitle(v)}</strong><span>${vehicleDisplayMeta(v)}</span></div>
                </div>
              </div>`).join('')}</div>`
          : '<div class="club-member-empty">Sin vehículo registrado</div>';
        return `<article class="club-member-card">
          <div class="club-member-header">${avatar}
            <div class="club-member-meta"><strong>${member.name}</strong>${isOwner ? '<span class="club-founder-badge">Fundador</span>' : ''}</div>
          </div>
          ${vehiclesHtml}
        </article>`;
      }).join('')}</div>`;
    }
    function getUserClubs(email) {
      const key = normalizeClubEmail(email);
      return getClubs().filter((c) => c.memberEmails.some((e) => normalizeClubEmail(e) === key));
    }
    function getPendingClubInvites(email) {
      const key = normalizeClubEmail(email);
      return getClubInvites().filter((inv) => normalizeClubEmail(inv.toEmail) === key && inv.status === 'pending');
    }
    function createClubRecord(input, creatorOverride) {
      const creator = creatorOverride || currentUser;
      if (!creator) return null;
      const club = {
        id: 'club_' + Date.now(),
        name: input.name.trim(),
        desc: input.description.trim(),
        description: input.description.trim(),
        vehicleMode: input.vehicleMode || 'mixto',
        creatorEmail: creator.email,
        creatorName: creator.name,
        memberEmails: [creator.email],
        createdAt: new Date().toISOString(),
        latitude: input.latitude,
        longitude: input.longitude,
        locationLabel: input.locationLabel || 'Tu zona',
      };
      saveClubs([club, ...getClubs()]);
      ensureClubChat(club);
      return club;
    }
    async function sendClubInvitation(clubId, toEmailRaw) {
      if (!currentUser) return { ok: false, error: 'Inicia sesión.' };
      const toKey = normalizeClubEmail(toEmailRaw);
      if (!toKey || !toKey.includes('@')) return { ok: false, error: 'Introduce un correo válido.' };
      const club = getClub(clubId);
      if (!club) return { ok: false, error: 'Club no encontrado.' };
      if (!isClubCreator(club, currentUser.email)) return { ok: false, error: 'Solo el creador del club puede invitar.' };
      if (toKey === normalizeClubEmail(currentUser.email)) return { ok: false, error: 'No puedes invitarte a ti mismo.' };
      if (isClubMember(club, toKey)) return { ok: false, error: 'Esa persona ya es miembro del club.' };
      const target = window.StradaCloud?.isActive()
        ? await findUserByEmailAsync(toKey)
        : findUserByEmail(toKey);
      if (!target) return { ok: false, error: 'No hay ningún usuario registrado con ese correo en Strada.' };
      const invites = getClubInvites();
      if (invites.some((inv) => inv.clubId === clubId && normalizeClubEmail(inv.toEmail) === toKey && inv.status === 'pending')) {
        return { ok: false, error: 'Ya hay una invitación pendiente para ese usuario.' };
      }
      invites.unshift({
        id: 'cinv_' + Date.now(),
        clubId,
        clubName: club.name,
        fromEmail: currentUser.email,
        fromName: currentUser.name,
        toEmail: target.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      saveClubInvites(invites);
      return { ok: true };
    }
    function acceptClubInvitation(inviteId) {
      if (!currentUser) return false;
      const invites = getClubInvites();
      const inv = invites.find((i) => i.id === inviteId);
      if (!inv || inv.status !== 'pending' || normalizeClubEmail(inv.toEmail) !== normalizeClubEmail(currentUser.email)) return false;
      saveClubInvites(invites.map((i) => i.id === inviteId ? { ...i, status: 'accepted', reviewedAt: new Date().toISOString() } : i));
      const clubs = getClubs();
      const idx = clubs.findIndex((c) => c.id === inv.clubId);
      if (idx >= 0 && !isClubMember(clubs[idx], currentUser.email)) {
        const updatedClub = { ...clubs[idx], memberEmails: [...clubs[idx].memberEmails, currentUser.email] };
        clubs[idx] = updatedClub;
        saveClubs(clubs);
        syncClubParticipant(updatedClub, currentUser.email, currentUser.name, true);
      }
      return true;
    }
    function rejectClubInvitation(inviteId) {
      if (!currentUser) return false;
      const invites = getClubInvites();
      const inv = invites.find((i) => i.id === inviteId);
      if (!inv || inv.status !== 'pending' || normalizeClubEmail(inv.toEmail) !== normalizeClubEmail(currentUser.email)) return false;
      saveClubInvites(invites.map((i) => i.id === inviteId ? { ...i, status: 'rejected', reviewedAt: new Date().toISOString() } : i));
      return true;
    }
    function renderClubsPanel() {
      const list = document.getElementById('clubsList');
      const toolbar = document.getElementById('createClubToolbar');
      if (!list) return;
      seedClubsIfEmpty();
      const paint = () => {
        if (!list) return;
        if (toolbar) {
          toolbar.innerHTML = currentUser && !getUserClubCreationRequests(currentUser.email).some((r) => r.status === 'pending')
            ? '<button class="btn btn-primary btn-sm" type="button" id="openCreateClubBtn">+ Solicitar club</button>'
            : '';
          const btn = document.getElementById('openCreateClubBtn');
          if (btn) btn.onclick = () => openCreateClubModal();
        }
        const radiusId = getClubSearchRadiusId();
        const maxKm = clubSearchRadiusMaxKm(radiusId);
        const lat = userGeo.lat ?? DEFAULT_GEO.lat;
        const lng = userGeo.lng ?? DEFAULT_GEO.lng;
        const nearby = clubsNearLocation(lat, lng, currentUser?.email, maxKm);
        let html = `<div class="clubs-section-head"><p class="section-title">${clubSearchSectionTitle(radiusId)}</p>
          <button type="button" class="link" id="refreshClubLocationBtn">${userGeo.status === 'loading' ? 'Ubicando…' : userGeo.status === 'denied' ? 'Usando Madrid' : 'Actualizar'}</button></div>
          <p class="hero-text" style="font-size:0.78rem;margin:-4px 0 8px">Perímetro de búsqueda</p>
          ${renderClubSearchRadiusChips(radiusId)}`;
        if (userGeo.status === 'loading' && !nearby.length) {
          html += '<div class="empty-state">Buscando clubes…</div>';
        } else if (!nearby.length) {
          html += `<div class="empty-state">${clubSearchEmptyMessage(radiusId)}</div>`;
        } else {
          html += nearby.map((club) => `<button type="button" class="chat-list-item club-nearby-item" data-club-id="${club.id}">
            <div class="club-nearby-top"><strong>${club.name}</strong><span class="club-distance">${formatDistanceKm(club.distanceKm)}</span></div>
            <span>${club.desc}</span>
            <span class="chat-list-meta">${club.locationLabel ? club.locationLabel + ' · ' : ''}${club.memberEmails.length} miembros · ${routeVehicleModeLabel(club.vehicleMode)}</span>
          </button>`).join('');
        }
        if (!currentUser) {
          html += '<div class="empty-state" style="margin-top:12px">Inicia sesión para solicitar un club o aceptar invitaciones.</div>';
        } else {
          const pendingReq = getUserClubCreationRequests(currentUser.email).find((r) => r.status === 'pending');
          if (pendingReq) {
            html += `<div class="club-pending-notice"><strong>Petición en estudio</strong>
              <p class="hero-text" style="font-size:0.82rem;margin-top:4px">El equipo de Strada está estudiando tu petición de creación del club «${pendingReq.name}». La revisión se envía a administración y te notificaremos aquí cuando haya una decisión.</p></div>`;
          }
          html += renderClubApprovalNotificationsHtml();
          html += renderAdminClubRequestsHtml();
          const pending = getPendingClubInvites(currentUser.email);
          const myClubs = getUserClubs(currentUser.email);
          if (pending.length) {
            html += `<p class="section-title">Invitaciones pendientes</p>${pending.map((inv) => `
              <div class="club-invite-card">
                <strong>${inv.clubName}</strong>
                <p class="hero-text" style="font-size:0.82rem">Te invita ${inv.fromName}</p>
                <div class="nav-row" style="margin-top:8px">
                  <button type="button" class="btn btn-primary btn-sm btn-accept-club" data-invite-id="${inv.id}">Aceptar</button>
                  <button type="button" class="btn btn-secondary btn-sm btn-reject-club" data-invite-id="${inv.id}">Rechazar</button>
                </div>
              </div>`).join('')}`;
          }
          html += `<p class="section-title">Mis clubes</p>`;
          if (!myClubs.length) {
            html += '<div class="empty-state">Aún no perteneces a ningún club. Crea uno o acepta una invitación.</div>';
          } else {
            html += myClubs.map((club) => `<button type="button" class="chat-list-item" data-club-id="${club.id}">
              <strong>${club.name}</strong>
              <span>${club.desc}</span>
              <span class="chat-list-meta">${club.locationLabel ? club.locationLabel + ' · ' : ''}${club.memberEmails.length} miembros · ${routeVehicleModeLabel(club.vehicleMode)}</span>
            </button>`).join('');
          }
        }
        list.innerHTML = html;
        bindClubApprovalNotifications(list);
        list.querySelectorAll('[data-club-radius]').forEach((btn) => {
          btn.onclick = () => {
            setClubSearchRadiusId(btn.dataset.clubRadius);
            paint();
          };
        });
        const refreshBtn = document.getElementById('refreshClubLocationBtn');
        if (refreshBtn) refreshBtn.onclick = () => requestUserLocation(() => paint());
        list.querySelectorAll('[data-club-id]').forEach((btn) => {
          btn.onclick = () => openClubDetail(btn.dataset.clubId);
        });
        list.querySelectorAll('.btn-accept-club').forEach((btn) => {
          btn.onclick = () => {
            if (acceptClubInvitation(btn.dataset.inviteId)) {
              showToast('Te uniste al club', 'success');
              renderClubsPanel();
              renderProfile();
            }
          };
        });
        list.querySelectorAll('.btn-reject-club').forEach((btn) => {
          btn.onclick = () => {
            rejectClubInvitation(btn.dataset.inviteId);
            showToast('Invitación rechazada');
            renderClubsPanel();
          };
        });
        list.querySelectorAll('.btn-approve-club-req').forEach((btn) => {
          btn.onclick = () => {
            const club = approveClubCreationRequest(btn.dataset.requestId);
            if (club) {
              showToast('Club creado', 'success');
              renderClubsPanel();
              renderProfile();
            }
          };
        });
        list.querySelectorAll('.btn-reject-club-req').forEach((btn) => {
          btn.onclick = () => {
            if (rejectClubCreationRequest(btn.dataset.requestId)) {
              showToast('Solicitud rechazada');
              renderClubsPanel();
              renderProfile();
            }
          };
        });
      };
      if (userGeo.lat == null && userGeo.status === 'idle') {
        requestUserLocation(paint);
        paint();
        return;
      }
      paint();
    }
    function openClubDetail(clubId) {
      activeClubId = clubId;
      closeModals();
      document.getElementById('mainShell').classList.add('hidden');
      document.getElementById('clubShell').classList.add('open');
      renderClubDetail();
    }
    function renderClubDetail() {
      const club = getClub(activeClubId);
      if (!club) return closeClubDetail();
      const isCreator = currentUser && isClubCreator(club, currentUser.email);
      const isMember = currentUser && isClubMember(club, currentUser.email);
      const sent = getClubInvites().filter((inv) => inv.clubId === club.id);
      document.getElementById('clubDetailTitle').textContent = club.name;
      document.getElementById('clubDetailContent').innerHTML = `
        <p class="hero-text">${club.desc}</p>
        <p class="join-mode-line">${routeVehicleModeIcon(club.vehicleMode)} ${routeVehicleModeLabel(club.vehicleMode)} · Creado por <strong>${club.creatorName}</strong></p>
        ${club.locationLabel ? `<p class="join-mode-line">📍 ${club.locationLabel}${clubDistanceLabel(club) ? ` · ${clubDistanceLabel(club)}` : ''}</p>` : ''}
        <p class="section-title">Participantes (${club.memberEmails.length})</p>
        ${renderClubMembersGallery(club)}
        ${isMember ? `<button class="btn btn-primary btn-sm" type="button" id="clubOpenChatBtn" style="margin-top:12px">Abrir chat del club</button>` : ''}
        ${isCreator ? `<p class="section-title">Invitar usuario</p>
          <p class="hero-text" style="font-size:0.82rem;margin-top:-6px">Envía una invitación por correo a otro usuario de Strada.</p>
          <div class="field"><label>Correo del usuario</label><input class="field-input" id="clubInviteEmail" type="email" placeholder="correo@ejemplo.com"></div>
          <div id="clubInviteError" class="alert alert-error" hidden></div>
          <button class="btn btn-primary btn-sm" type="button" id="clubSendInviteBtn">Enviar invitación</button>
          ${sent.length ? `<p class="section-title" style="margin-top:16px">Invitaciones enviadas</p>
            ${sent.map((inv) => `<div class="join-request-row"><div><strong>${inv.toEmail}</strong></div><span class="hero-text" style="font-size:0.82rem">${inv.status === 'pending' ? 'Pendiente' : inv.status === 'accepted' ? 'Aceptada' : 'Rechazada'}</span></div>`).join('')}` : ''}
          <div class="club-danger-zone">
            <button class="btn btn-secondary btn-sm" type="button" id="clubDeleteBtn">Eliminar club</button>
            <div id="clubDeleteConfirm" class="club-delete-confirm" hidden>
              <p class="club-delete-question">¿Seguro que quieres eliminar el club?</p>
              <p class="hero-text" style="font-size:0.82rem">Se eliminará «${club.name}» y todas sus invitaciones. Esta acción no se puede deshacer.</p>
              <div class="nav-row" style="margin-top:10px">
                <button class="btn btn-primary btn-sm" type="button" id="clubDeleteConfirmYes">Sí, eliminar</button>
                <button class="btn btn-secondary btn-sm" type="button" id="clubDeleteConfirmNo">Cancelar</button>
              </div>
            </div>
          </div>` : ''}
      `;
      const openChatBtn = document.getElementById('clubOpenChatBtn');
      if (openChatBtn) {
        openChatBtn.onclick = () => {
          const chat = ensureClubChat(club);
          openChatThread(chat.id);
        };
      }
      const sendBtn = document.getElementById('clubSendInviteBtn');
      if (sendBtn) {
        sendBtn.onclick = async () => {
          const err = document.getElementById('clubInviteError');
          const result = await sendClubInvitation(club.id, document.getElementById('clubInviteEmail').value);
          if (!result.ok) return showError(err, result.error);
          showError(err, '');
          showToast('Invitación enviada', 'success');
          renderClubDetail();
        };
      }
      const deleteBtn = document.getElementById('clubDeleteBtn');
      const deleteConfirm = document.getElementById('clubDeleteConfirm');
      if (deleteBtn && deleteConfirm) {
        deleteBtn.onclick = () => {
          deleteBtn.hidden = true;
          deleteConfirm.hidden = false;
        };
        document.getElementById('clubDeleteConfirmNo').onclick = () => {
          deleteConfirm.hidden = true;
          deleteBtn.hidden = false;
        };
        document.getElementById('clubDeleteConfirmYes').onclick = () => {
          if (deleteClubRecord(club.id)) {
            closeClubDetail();
            renderClubsPanel();
            renderProfile();
            showToast('Club eliminado');
          }
        };
      }
    }
    function closeClubDetail() {
      activeClubId = null;
      document.getElementById('clubShell').classList.remove('open');
      document.getElementById('mainShell').classList.remove('hidden');
    }
    function openCreateClubModal() {
      if (!currentUser) return;
      createClubVehicleMode = 'mixto';
      document.getElementById('createClubForm').reset();
      bindCreateClubVehicleMode();
      document.querySelectorAll('#ccVehicleMode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'mixto'));
      showError(document.getElementById('createClubError'), '');
      document.getElementById('createClubModal').classList.add('open');
    }
    function closeCreateClubModal() {
      document.getElementById('createClubModal').classList.remove('open');
    }
    function bindCreateClubVehicleMode() {
      const wrap = document.getElementById('ccVehicleMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.onclick = () => {
          createClubVehicleMode = btn.dataset.mode;
          wrap.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === createClubVehicleMode));
        };
      });
    }
    function getAllMeetups() {
      return [...getCustomMeetups(), ...seedMeetups].sort((a, b) => new Date(a.meetingAt) - new Date(b.meetingAt));
    }
    function getMeetup(id) { return getAllMeetups().find((m) => m.id === id); }
    function getMeetupForRoute(routeId) { return getAllMeetups().find((m) => m.routeId === routeId); }
    function getMeetupSignups(meetupId) { return getSignups().filter((s) => s.meetupId === meetupId); }
    function meetupVehicleMode(meetup) {
      return meetup.vehicleMode || (meetup.routeId && getRoute(meetup.routeId)?.vehicleMode) || 'mixto';
    }
    function meetupNavPoint(meetup) {
      if (meetup.meetingLat != null) return { lat: meetup.meetingLat, lng: meetup.meetingLng, label: meetup.meetingPoint };
      const route = meetup.routeId ? getRoute(meetup.routeId) : null;
      if (route?.meetingLat != null) return { lat: route.meetingLat, lng: route.meetingLng, label: meetup.meetingPoint || route.meetingPoint };
      return { lat: 40.4168, lng: -3.7038, label: meetup.meetingPoint || 'Punto de encuentro' };
    }
    function meetupCover(meetup) {
      if (meetup.coverImage) return meetup.coverImage;
      if (meetup.routeId) return getRouteCover(getRoute(meetup.routeId));
      return DEFAULT_ROUTE_COVER;
    }
    function buildMeetupFromRoute(route) {
      return {
        id: 'meetup_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        routeId: route.id,
        title: route.title,
        desc: route.desc,
        meetingAt: route.meetingAt,
        meetingPoint: route.meetingPoint,
        meetingLat: route.meetingLat,
        meetingLng: route.meetingLng,
        maxAttendees: route.maxAttendees,
        vehicleMode: route.vehicleMode || 'mixto',
        coverImage: route.coverImage,
        creatorName: route.creatorName,
        creatorEmail: route.creatorEmail,
        createdAt: new Date().toISOString(),
      };
    }
    function migrateCustomRoutesToMeetups() {
      const meetups = getCustomMeetups();
      const linked = new Set(meetups.map((m) => m.routeId).filter(Boolean));
      let changed = false;
      getCustomRoutes().filter((r) => r.meetingAt && !linked.has(r.id)).forEach((r) => {
        meetups.unshift(buildMeetupFromRoute(r));
        linked.add(r.id);
        changed = true;
      });
      if (changed) saveCustomMeetups(meetups);
    }
    function getAllPosts() {
      const userPosts = getFeedPosts();
      const merged = [...userPosts, ...seedPosts];
      return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    function getPost(id) { return getAllPosts().find((p) => p.id === id); }
    function timeAgo(iso) {
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
    function isPostLiked(post) {
      return currentUser && post.likes?.includes(currentUser.email);
    }
    function updatePost(id, updater) {
      const stored = getFeedPosts();
      const idx = stored.findIndex((p) => p.id === id);
      if (idx >= 0) {
        stored[idx] = updater(stored[idx]);
        saveFeedPosts(stored);
        return;
      }
      const seed = seedPosts.find((p) => p.id === id);
      if (seed) {
        const copy = JSON.parse(JSON.stringify(seed));
        const updated = updater(copy);
        updated.seed = false;
        saveFeedPosts([updated, ...stored]);
      }
    }
    function normalizeEmail(e) { return e.trim().toLowerCase(); }
    function isValidEmail(email) {
      const value = (email || '').trim();
      if (!value || value.length > 254) return false;
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }
    function assertValidEmail(email) {
      if (!isValidEmail(email)) throw new Error('Introduce un correo válido con dominio completo (ej. tu@correo.com).');
    }
    function getInitials(n) { return n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join(''); }
    function vehicleIcon(id) { return VEHICLES.find((v) => v.id === id)?.icon || '🚗'; }

    function coerceVehicleType(type) {
      return type === 'moto' ? 'moto' : 'coche';
    }

    function buildVehicleLabel(brand, model, year) {
      return `${brand.trim()} ${model.trim()} (${year})`;
    }

    function vehicleDisplayTitle(v) {
      if (v.brand && v.model) return `${v.brand} ${v.model}`;
      return v.label || 'Vehículo';
    }

    function vehicleDisplayMeta(v) {
      const parts = [vehicleName(v.type)];
      if (v.year) parts.push(String(v.year));
      return parts.join(' · ');
    }

    function normalizeVehicleRecord(v) {
      const type = coerceVehicleType(v.type);
      const brand = (v.brand || '').trim();
      const model = (v.model || '').trim();
      const year = v.year ? Number(v.year) : undefined;
      let label = (v.label || '').trim();
      if (brand && model && year) label = buildVehicleLabel(brand, model, year);
      else if (!brand && !model && label) return { ...v, type, brand: '', model: label, label };
      else if (brand && model) label = year ? buildVehicleLabel(brand, model, year) : `${brand} ${model}`;
      return { ...v, type, brand, model: model || label, year, label: label || `${brand} ${model}`.trim() || 'Vehículo' };
    }

    function validateVehicleForm(brand, model, yearText, photoUrl) {
      if (!brand.trim()) return 'Indica la marca del vehículo.';
      if (!model.trim()) return 'Indica el modelo.';
      const year = Number(yearText);
      const maxYear = new Date().getFullYear() + 1;
      if (!yearText.trim() || !Number.isInteger(year) || year < 1950 || year > maxYear) {
        return `Indica un año válido (1950–${maxYear}).`;
      }
      if (!(photoUrl || '').trim()) return 'Sube al menos una foto de tu coche o moto.';
      return null;
    }

    function normalizeUserVehicles(vehicles) {
      const list = Array.isArray(vehicles) ? vehicles.map(normalizeVehicleRecord) : [];
      if (!list.length) return [];
      const hasDefault = list.some((v) => v.isDefault);
      return list.map((v, i) => ({ ...v, isDefault: hasDefault ? !!v.isDefault : i === 0 }));
    }

    function userFromRecord(record) {
      return {
        id: record.id || null,
        name: record.name,
        email: record.email,
        avatarUrl: record.avatarUrl || null,
        socials: normalizeSocials(record.socials),
        vehicles: normalizeUserVehicles(record.vehicles),
      };
    }

    function syncCurrentUserToStorage() {
      if (!currentUser) return;
      if (window.StradaCloud?.isActive() && currentUser.id) {
        void window.StradaCloud.updateProfile(currentUser);
        return;
      }
      const users = getUsers();
      const idx = users.findIndex((u) => u.email === currentUser.email);
      if (idx < 0) return;
      users[idx] = {
        ...users[idx],
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || undefined,
        socials: normalizeSocials(currentUser.socials),
        vehicles: currentUser.vehicles || [],
      };
      saveUsers(users);
    }

    function renderAvatarHtml(sizeClass = 'profile-avatar') {
      if (currentUser?.avatarUrl) {
        return `<div class="${sizeClass}"><img src="${currentUser.avatarUrl}" alt=""></div>`;
      }
      return `<div class="${sizeClass}">${getInitials(currentUser?.name || '?')}</div>`;
    }

    function getAllRoutes() { return [...getCustomRoutes(), ...seedRoutes]; }
    function getRoute(id) { return getAllRoutes().find((r) => r.id === id); }
    function getRouteSignups(routeId) { return getSignups().filter((s) => s.routeId === routeId); }
    function formatDate(iso) { return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); }
    function vehicleName(id) { return VEHICLES.find((v) => v.id === id)?.label || id; }

    function levelTagClass(level) {
      const l = (level || '').toLowerCase();
      if (l.includes('fácil') || l.includes('facil')) return 'level-facil';
      if (l.includes('exigente')) return 'level-exigente';
      return 'level-media';
    }

    function matchesRouteFilter(route) {
      if (routeFilterId === 'all') return true;
      const region = (route.region || '').toLowerCase();
      const level = (route.level || '').toLowerCase();
      if (routeFilterId === 'andalucia') return region.includes('andaluc');
      if (routeFilterId === 'madrid') return region.includes('madrid');
      if (routeFilterId === 'cantabria') return region.includes('cantabria');
      if (routeFilterId === 'facil') return level.includes('fácil') || level.includes('facil');
      if (routeFilterId === 'exigente') return level.includes('exigente');
      if (routeFilterId === 'motos') {
        const mode = route.vehicleMode || 'mixto';
        return mode === 'motos' || mode === 'mixto';
      }
      if (routeFilterId === 'coches') {
        const mode = route.vehicleMode || 'mixto';
        return mode === 'coches' || mode === 'mixto';
      }
      return true;
    }

    function matchesRouteSearch(route) {
      const q = routeSearchQuery.trim().toLowerCase();
      if (!q) return true;
      const haystack = [route.title, route.region, route.desc, route.meetingPoint, ...(route.stops || [])]
        .join(' ').toLowerCase();
      return haystack.includes(q);
    }

    function getFilteredRoutes() {
      return getAllRoutes().filter((r) => matchesRouteFilter(r) && matchesRouteSearch(r));
    }

    function getProfileCompletion() {
      if (!currentUser) return { percent: 0, steps: [] };
      const steps = [
        { id: 'photo', label: 'Foto', done: !!currentUser.avatarUrl },
        { id: 'vehicle', label: 'Vehículo', done: (currentUser.vehicles || []).length > 0 },
        { id: 'signup', label: 'Quedada', done: getSignups().some((s) => s.userEmail === currentUser.email) },
      ];
      const done = steps.filter((s) => s.done).length;
      return { percent: Math.round((done / steps.length) * 100), steps };
    }

    function renderWelcomeBanner() {}


    function renderExploreExtras() {
      const routes = getAllRoutes();
      const upcoming = getAllMeetups();
      const statsEl = document.getElementById('exploreStats');
      statsEl.innerHTML = `
        <div class="quick-stat"><strong>${routes.length}</strong><span>Rutas</span></div>
        <div class="quick-stat"><strong>${upcoming.length}</strong><span>Quedadas</span></div>
        <div class="quick-stat"><strong>${getFeedPosts().length + seedPosts.length}</strong><span>Posts</span></div>`;

      const bannerEl = document.getElementById('nextEventBanner');
      if (upcoming[0]) {
        const next = upcoming[0];
        bannerEl.innerHTML = `<div class="next-event-banner" data-meetup-id="${next.id}">
          <div class="neb-kicker">Próxima quedada</div>
          <strong>${next.title}</strong>
          <span>${formatDate(next.meetingAt)} · ${next.meetingPoint || ''}</span>
        </div>`;
        bannerEl.querySelector('.next-event-banner').onclick = () => openMeetupDetail(next.id);
      } else {
        bannerEl.innerHTML = '';
      }

      const filtersEl = document.getElementById('routeFilters');
      filtersEl.innerHTML = ROUTE_FILTERS.map((f) =>
        `<button type="button" class="filter-chip ${f.id === routeFilterId ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>`
      ).join('');
      filtersEl.querySelectorAll('[data-filter]').forEach((btn) => {
        btn.onclick = () => {
          routeFilterId = btn.dataset.filter;
          renderExploreExtras();
          renderRouteList();
        };
      });

      const searchEl = document.getElementById('routeSearch');
      if (searchEl && searchEl.dataset.bound !== '1') {
        searchEl.dataset.bound = '1';
        searchEl.oninput = () => {
          routeSearchQuery = searchEl.value;
          renderRouteList();
        };
      }
    }

    function renderRouteList() {
      const routes = getFilteredRoutes();
      const routeList = document.getElementById('routeList');
      const countEl = document.getElementById('routeCount');
      if (countEl) countEl.textContent = routes.length ? `(${routes.length})` : '';
      routeList.innerHTML = routes.length
        ? routes.map(renderRouteCard).join('')
        : '<div class="empty-state">No hay rutas con ese filtro. Prueba otra búsqueda.</div>';
      bindRouteCards(routeList);
    }

    function openAvatarPicker() {
      const grid = document.getElementById('avatarPresets');
      grid.innerHTML = AVATAR_PRESETS.map((url, i) =>
        `<button type="button" class="avatar-preset ${currentUser?.avatarUrl === url ? 'active' : ''}" data-url="${url}">
          <img src="${url}" alt="Avatar ${i + 1}">
        </button>`
      ).join('');
      grid.querySelectorAll('[data-url]').forEach((btn) => {
        btn.onclick = () => {
          currentUser.avatarUrl = btn.dataset.url;
          syncCurrentUserToStorage();
          closeModals();
          renderProfile();
          updateHeaderBadge();
          showToast('Foto de perfil actualizada', 'success');
        };
      });
      document.getElementById('avatarPickerModal').classList.add('open');
    }

    function getRoutePath(route) {
      if (route?.path?.length) return route.path;
      if (route?.meetingLat != null) return [[route.meetingLat, route.meetingLng]];
      return [[40.4168, -3.7038]];
    }

    function getActiveDriveRoute() {
      if (currentUser) {
        const mySignup = getSignups().find((s) => s.userEmail === currentUser.email);
        if (mySignup?.routeId) return getRoute(mySignup.routeId);
        if (mySignup?.meetupId) {
          const meetup = getMeetup(mySignup.meetupId);
          if (meetup?.routeId) return getRoute(meetup.routeId);
        }
      }
      return getRoute('madrid');
    }

    function openNavigation(lat, lng, label, provider = 'google') {
      if (lat == null || lng == null) {
        showToast('Ubicación no disponible');
        return;
      }
      const name = encodeURIComponent(label || 'Destino');
      const url = provider === 'waze'
        ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
      showToast(provider === 'waze' ? 'Abriendo Waze…' : 'Abriendo Google Maps…');
    }

    function clearDriveMapLayers() {
      driveMapLayers.forEach((layer) => driveMap?.removeLayer(layer));
      driveMapLayers = [];
    }

    function initDriveMap() {
      const route = getActiveDriveRoute();
      if (!route || typeof L === 'undefined') return;

      const path = getRoutePath(route);
      const el = document.getElementById('driveMap');
      if (!el) return;

      if (!driveMap) {
        driveMap = L.map('driveMap', { zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(driveMap);
      }

      clearDriveMapLayers();

      const line = L.polyline(path, { color: '#53b7ff', weight: 7, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(driveMap);
      driveMapLayers.push(line);

      const carIcon = L.divIcon({
        className: 'car-marker',
        html: '<div style="width:18px;height:18px;background:#53b7ff;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const car = L.marker(path[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(driveMap);
      driveMapLayers.push(car);

      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: '<div style="width:14px;height:14px;background:#e85d2c;border:2px solid #fff;border-radius:50%"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const dest = L.marker(path[path.length - 1], { icon: destIcon }).addTo(driveMap);
      driveMapLayers.push(dest);

      path.forEach((pt, i) => {
        if (i === 0 || i === path.length - 1) return;
        const stop = L.circleMarker(pt, { radius: 5, color: '#fff', weight: 2, fillColor: '#243040', fillOpacity: 1 }).addTo(driveMap);
        driveMapLayers.push(stop);
      });

      driveMap.fitBounds(line.getBounds(), { padding: [50, 50] });
      setTimeout(() => driveMap?.invalidateSize(), 80);

      document.getElementById('navInstruction').textContent = route.navInstruction || 'Sigue la ruta marcada';
      document.getElementById('navDistance').textContent = `En ${route.navNextKm || '—'} km`;
      document.getElementById('navEta').textContent = `${route.min || '—'} min`;
      document.getElementById('navRemain').textContent = `${route.km || '—'} km`;
      document.getElementById('navTurnIcon').textContent = '➡️';
    }

    function showToast(msg, type = '') {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.className = 'toast show' + (type ? ' ' + type : '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
    }

    function closeModals() {
      document.getElementById('createRouteModal').classList.remove('open');
      document.getElementById('createMeetupModal').classList.remove('open');
      document.getElementById('joinModal').classList.remove('open');
      document.getElementById('createPostModal').classList.remove('open');
      document.getElementById('vehicleFormModal').classList.remove('open');
      document.getElementById('avatarPickerModal').classList.remove('open');
      document.getElementById('createClubModal').classList.remove('open');
    }

    function showAuth(screen) {
      closeModals();
      document.getElementById('authLogin').classList.toggle('open', screen === 'login');
      document.getElementById('authRegister').classList.toggle('open', screen === 'register');
      document.getElementById('mainShell').classList.add('hidden');
      document.getElementById('detailShell').classList.remove('open');
      document.getElementById('chatShell').classList.remove('open');
      document.getElementById('clubShell').classList.remove('open');
    }

    function showApp() {
      document.getElementById('authLogin').classList.remove('open');
      document.getElementById('authRegister').classList.remove('open');
      document.getElementById('mainShell').classList.remove('hidden');
      document.getElementById('chatShell').classList.remove('open');
      document.getElementById('clubShell').classList.remove('open');
    }

    function showError(el, msg) { if (el) { el.textContent = msg; el.hidden = !msg; } }

    function requireAuth(action) {
      if (currentUser) return true;
      pendingAction = action;
      showAuth('login');
      return false;
    }

    function runPendingAction() {
      if (!pendingAction || !currentUser) return;
      const action = pendingAction;
      pendingAction = null;
      if (action.type === 'join') { openDetail(action.routeId); handleJoinClick(action.routeId); }
      if (action.type === 'joinMeetup') { openMeetupDetail(action.meetupId); handleMeetupJoinClick(action.meetupId); }
      if (action.type === 'create') openCreateRouteModal();
      if (action.type === 'createMeetup') openCreateMeetupModal();
      if (action.type === 'createPost') openCreatePostModal();
      if (action.type === 'like' || action.type === 'comment') showTab('explore');
    }

    function renderFeedPost(post) {
      const liked = isPostLiked(post);
      const likeCount = post.likes?.length || 0;
      const comments = post.comments || [];
      const expanded = expandedComments.has(post.id);
      const visibleComments = expanded ? comments : comments.slice(-2);
      const hiddenCount = expanded ? 0 : Math.max(0, comments.length - 2);

      const meta = [post.vehicleLabel, post.routeTitle].filter(Boolean).map(escapeHtml).join(' · ');
      const imgSrc = safeImgUrl(post.imageUrl);

      return `<article class="feed-post" data-post-id="${escapeHtml(post.id)}">
        <div class="feed-post-header">
          <div class="feed-avatar">${getInitials(post.authorName)}</div>
          <div class="feed-author">
            <strong>${escapeHtml(post.authorName)}</strong>
            ${meta ? `<span>${meta}</span>` : ''}
          </div>
          <span class="feed-time">${timeAgo(post.createdAt)}</span>
        </div>
        ${imgSrc ? `<div class="feed-image-wrap" data-post-id="${escapeHtml(post.id)}"><img src="${imgSrc}" alt="Foto" loading="lazy"></div>` : ''}
        <div class="feed-actions">
          <button type="button" class="feed-action-btn btn-like ${liked ? 'liked' : ''}" data-post-id="${escapeHtml(post.id)}" aria-label="Me gusta">${liked ? '❤️' : '🤍'}</button>
          <button type="button" class="feed-action-btn btn-focus-comment" data-post-id="${escapeHtml(post.id)}" aria-label="Comentar">💬</button>
        </div>
        ${likeCount ? `<div class="feed-likes">${likeCount} me gusta</div>` : ''}
        <div class="feed-caption"><strong>${escapeHtml(post.authorName)}</strong> ${escapeHtml(post.caption)}</div>
        <div class="feed-comments" id="comments-${escapeHtml(post.id)}">
          ${hiddenCount ? `<button type="button" class="feed-comment-more btn-expand-comments" data-post-id="${escapeHtml(post.id)}">Ver los ${hiddenCount} comentarios anteriores</button>` : ''}
          ${visibleComments.map((c) => `<p class="feed-comment"><strong>${escapeHtml(c.authorName)}</strong> ${escapeHtml(c.text)}</p>`).join('')}
        </div>
        <form class="feed-comment-form" data-post-id="${escapeHtml(post.id)}">
          <input class="feed-comment-input" placeholder="${currentUser ? 'Añade un comentario…' : 'Inicia sesión para comentar'}" ${currentUser ? '' : 'disabled'} maxlength="280">
          <button type="submit" class="feed-comment-send" ${currentUser ? '' : 'disabled'}>Publicar</button>
        </form>
      </article>`;
    }

    function bindFeedEvents() {
      document.querySelectorAll('.btn-like').forEach((btn) => {
        btn.onclick = () => {
          if (!requireAuth({ type: 'like' })) return;
          const post = getPost(btn.dataset.postId);
          if (!post) return;
          updatePost(post.id, (p) => {
            const likes = p.likes || [];
            const has = likes.includes(currentUser.email);
            p.likes = has ? likes.filter((e) => e !== currentUser.email) : [...likes, currentUser.email];
            return p;
          });
          renderFeed();
        };
      });
      document.querySelectorAll('.btn-expand-comments').forEach((btn) => {
        btn.onclick = () => {
          expandedComments.add(btn.dataset.postId);
          renderFeed();
        };
      });
      document.querySelectorAll('.btn-focus-comment').forEach((btn) => {
        btn.onclick = () => {
          const input = document.querySelector(`.feed-comment-form[data-post-id="${btn.dataset.postId}"] .feed-comment-input`);
          if (!currentUser) return requireAuth({ type: 'comment' });
          input?.focus();
        };
      });
      document.querySelectorAll('.feed-comment-form').forEach((form) => {
        form.onsubmit = (e) => {
          e.preventDefault();
          if (!requireAuth({ type: 'comment' })) return;
          const input = form.querySelector('.feed-comment-input');
          const text = input.value.trim();
          if (!text) return;
          const postId = form.dataset.postId;
          updatePost(postId, (p) => {
            p.comments = [...(p.comments || []), {
              id: 'c_' + Date.now(),
              authorEmail: currentUser.email,
              authorName: currentUser.name,
              text,
              createdAt: new Date().toISOString(),
            }];
            return p;
          });
          expandedComments.add(postId);
          renderFeed();
          showToast('Comentario publicado', 'success');
        };
      });
      document.querySelectorAll('.feed-image-wrap').forEach((wrap) => {
        wrap.onclick = () => {
          const postId = wrap.dataset.postId;
          const now = Date.now();
          if (lastFeedTap.id === postId && now - lastFeedTap.time < 350) {
            if (!requireAuth({ type: 'like' })) return;
            updatePost(postId, (p) => {
              if (!currentUser) return p;
              const likes = p.likes || [];
              if (!likes.includes(currentUser.email)) p.likes = [...likes, currentUser.email];
              return p;
            });
            renderFeed();
            showToast('❤️ Me gusta', 'success');
            lastFeedTap = { id: null, time: 0 };
            return;
          }
          lastFeedTap = { id: postId, time: now };
        };
      });
    }

    function renderFeed() {
      const posts = getAllPosts();
      const toolbar = document.getElementById('feedToolbar');
      toolbar.innerHTML = currentUser
        ? '<button class="btn btn-primary btn-sm" type="button" id="createPostBtn">+ Nueva publicación</button>'
        : '<button class="btn btn-secondary btn-sm" type="button" id="createPostBtn">Inicia sesión para publicar</button>';
      document.getElementById('createPostBtn').onclick = () => {
        if (!requireAuth({ type: 'createPost' })) return;
        openCreatePostModal();
      };

      const list = document.getElementById('feedList');
      list.innerHTML = posts.length
        ? posts.map(renderFeedPost).join('')
        : '<div class="empty-state">Aún no hay publicaciones. ¡Sé el primero!</div>';
      bindFeedEvents();
    }

    function renderPostPreview() {
      const el = document.getElementById('postFeedPreview');
      if (!el || !currentUser) return;
      const caption = document.getElementById('postCaption')?.value.trim() || '';
      const routeTitle = document.getElementById('postRoute')?.value.trim() || '';
      const vehicleLabel = document.getElementById('postVehicle')?.value.trim() || '';
      const meta = [vehicleLabel, routeTitle].filter(Boolean).map(escapeHtml).join(' · ');
      const imgSrc = pendingPostImage ? safeImgUrl(pendingPostImage) : '';
      const imageBlock = imgSrc
        ? `<div class="feed-image-wrap"><img src="${imgSrc}" alt="Previsualización"></div>`
        : `<div class="feed-image-wrap post-preview-image-empty"><span>📷</span><p>Tu foto aparecerá aquí</p></div>`;
      const captionBlock = caption
        ? `<div class="feed-caption"><strong>${escapeHtml(currentUser.name)}</strong> ${escapeHtml(caption)}</div>`
        : `<div class="feed-caption post-preview-caption-empty">La descripción aparecerá aquí…</div>`;
      el.innerHTML = `
        <div class="feed-post-header">
          <div class="feed-avatar">${getInitials(currentUser.name)}</div>
          <div class="feed-author">
            <strong>${escapeHtml(currentUser.name)}</strong>
            ${meta ? `<span>${meta}</span>` : ''}
          </div>
          <span class="feed-time">ahora</span>
        </div>
        ${imageBlock}
        ${captionBlock}`;
    }

    function openCreatePostModal() {
      if (!currentUser) return;
      pendingPostImage = null;
      document.getElementById('createPostForm').reset();
      document.getElementById('postFileLabel').textContent = '📷 Toca para elegir foto *';
      showError(document.getElementById('createPostError'), '');
      renderPostPreview();
      document.getElementById('createPostModal').classList.add('open');
    }

    function closeCreatePostModal() {
      document.getElementById('createPostModal').classList.remove('open');
      pendingPostImage = null;
    }

    function compressImage(file, maxW, quality) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxW) { h = (h * maxW) / w; w = maxW; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function renderEventCard(meetup) {
      const count = getMeetupSignups(meetup.id).length;
      const creator = meetup.creatorName || 'Comunidad';
      const mode = meetupVehicleMode(meetup);
      const route = meetup.routeId ? getRoute(meetup.routeId) : null;
      const tags = [joinModeShort(meetup), routeVehicleModeLabel(mode), `${count}/${meetup.maxAttendees || '∞'} apuntados`];
      if (route) tags.unshift(route.region.split(' ·')[0]);
      const signedUp = currentUser && getMeetupSignups(meetup.id).some((s) => s.userEmail === currentUser.email);
      const isFull = meetup.maxAttendees && count >= meetup.maxAttendees;
      const pending = getUserPendingJoinRequest({ meetupId: meetup.id });
      let joinLabel = 'Inicia sesión para apuntarte';
      if (currentUser) {
        if (signedUp) joinLabel = 'Cancelar apunte';
        else if (!isJoinOpen(meetup) && pending) joinLabel = 'Cancelar solicitud';
        else if (!isJoinOpen(meetup)) joinLabel = isFull ? 'Completa' : 'Solicitar unirse';
        else joinLabel = isFull ? 'Completa' : 'Apuntarme';
      }
      return `<div class="event-card">
        <div class="card community">
          ${meetup.coverImage || route ? `<div class="route-cover" style="margin:-14px -14px 12px;border-radius:12px 12px 0 0"><img src="${meetupCover(meetup)}" alt="" loading="lazy"></div>` : ''}
          <div class="route-creator" style="margin-bottom:8px">
            <span class="route-creator-avatar">${getInitials(creator)}</span>
            <span>Organiza <strong>${creator}</strong></span>
          </div>
          <div class="card-top"><span class="card-title">${meetup.title}</span><span class="card-meta">${formatDate(meetup.meetingAt)}</span></div>
          <p class="card-desc">${meetup.desc}</p>
          <p class="card-meeting">📍 ${meetup.meetingPoint || 'Punto de encuentro'}</p>
          ${route ? `<p class="hero-text" style="font-size:0.82rem;margin-top:4px">Ruta vinculada: <strong>${route.title}</strong> · ${route.km} km</p>` : ''}
          <div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
          <div class="nav-row">
            <button type="button" class="btn btn-primary btn-sm btn-go-meeting" data-meetup-id="${meetup.id}" data-provider="google">📍 Ir a la quedada</button>
            <button type="button" class="btn btn-secondary btn-sm btn-go-meeting" data-meetup-id="${meetup.id}" data-provider="waze">Waze</button>
          </div>
          <button type="button" class="btn btn-secondary btn-sm btn-join-meetup" data-meetup-id="${meetup.id}" style="min-height:36px;margin-top:6px" ${currentUser && !signedUp && isFull ? 'disabled' : ''}>${joinLabel}</button>
          ${route ? `<button type="button" class="btn btn-ghost btn-sm btn-view-route" data-route-id="${route.id}" style="min-height:36px;margin-top:4px">Ver ruta vinculada</button>` : ''}
        </div>
      </div>`;
    }

    function bindEventCards(container) {
      container.querySelectorAll('.btn-go-meeting').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const meetup = getMeetup(btn.dataset.meetupId);
          if (!meetup) return;
          const nav = meetupNavPoint(meetup);
          openNavigation(nav.lat, nav.lng, nav.label, btn.dataset.provider);
        };
      });
      container.querySelectorAll('.btn-view-route').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          openDetail(btn.dataset.routeId);
        };
      });
      container.querySelectorAll('.btn-join-meetup').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          handleMeetupJoinClick(btn.dataset.meetupId);
        };
      });
    }

    function getRouteCover(route) {
      return route.coverImage || DEFAULT_ROUTE_COVER;
    }

    function renderRouteCard(route) {
      const meetup = getMeetupForRoute(route.id);
      const count = meetup ? getMeetupSignups(meetup.id).length : getRouteSignups(route.id).length;
      const creator = route.creatorName || 'Comunidad';
      const accessTarget = meetup || route;
      const tags = [joinModeShort(accessTarget), route.region.split(' ·')[0], routeVehicleModeLabel(route.vehicleMode)];
      if (meetup) tags.push(`${count}/${meetup.maxAttendees || '∞'} apuntados`);
      const mode = route.vehicleMode || 'mixto';

      return `<article class="route-card community" data-route-id="${route.id}">
        <div class="route-cover">
          <img src="${getRouteCover(route)}" alt="Vista previa de ${route.title}" loading="lazy">
          <span class="route-vehicle-badge">${routeVehicleModeIcon(mode)} ${routeVehicleModeLabel(mode)}</span>
          <span class="route-level tag ${levelTagClass(route.level)}">${route.level}</span>
        </div>
        <div class="route-body">
          <div class="route-creator">
            <span class="route-creator-avatar">${getInitials(creator)}</span>
            <span>Por <strong>${creator}</strong></span>
            <span class="route-meta">${route.km} km · ${formatDuration(route.min)}</span>
          </div>
          <h4 class="route-title">${route.title}</h4>
          <p class="route-desc">${route.desc}</p>
          ${meetup ? `<p class="card-meeting">${formatDate(meetup.meetingAt)} · ${meetup.meetingPoint || ''}</p>` : ''}
          <div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      </article>`;
    }

    function bindRouteCards(container) {
      container.querySelectorAll('[data-route-id]').forEach((el) => {
        el.onclick = () => openDetail(el.dataset.routeId);
      });
    }

    function renderDrivePanel() {
      const activeRoute = getActiveDriveRoute();

      document.getElementById('driveRouteCard').innerHTML = `
        <div class="card community" style="cursor:default;border-color:var(--accent);margin-bottom:10px">
          <div class="card-top"><span class="card-title">${activeRoute.title}</span><span class="card-meta">${currentUser ? 'Tu ruta activa' : 'Ruta destacada'}</span></div>
          <p class="card-desc">${activeRoute.km} km · ${formatDuration(activeRoute.min)} · ${activeRoute.stops.length} paradas</p>
        </div>`;

      const groupList = document.getElementById('groupList');
      const signups = getRouteSignups(activeRoute.id);
      groupList.innerHTML = signups.length
        ? signups.map((s) => `<p>· <strong>${s.userName}</strong> — ${vehicleName(s.vehicleType)} ${s.vehicleLabel}</p>`).join('')
        : '<p style="color:var(--muted);font-size:0.82rem">Nadie en ruta aún. Apúntate desde el detalle.</p>';

      if (document.querySelector('[data-panel="drive"].active')) {
        initDriveMap();
      }
    }

    function renderRoutesPanel() {
      renderWelcomeBanner();
      renderExploreExtras();
      renderRouteList();
      document.getElementById('createRouteToolbar').innerHTML = currentUser
        ? '<button class="btn btn-primary btn-sm" type="button" id="createRouteBtn">+ Crear ruta</button>'
        : '<button class="btn btn-secondary btn-sm" type="button" id="createRouteBtn">Inicia sesión para crear ruta</button>';
      document.getElementById('createRouteBtn').onclick = () => {
        if (!requireAuth({ type: 'create' })) return;
        openCreateRouteModal();
      };
    }

    function renderEventsPanel() {
      const toolbar = document.getElementById('createMeetupToolbar');
      if (toolbar) {
        toolbar.innerHTML = currentUser
          ? '<button class="btn btn-primary btn-sm" type="button" id="createMeetupBtn">+ Organizar quedada</button>'
          : '<button class="btn btn-secondary btn-sm" type="button" id="createMeetupBtn">Inicia sesión para organizar quedada</button>';
        document.getElementById('createMeetupBtn').onclick = () => {
          if (!requireAuth({ type: 'createMeetup' })) return;
          openCreateMeetupModal();
        };
      }
      const upcoming = getAllMeetups();
      const eventsList = document.getElementById('eventsList');
      let eventsHtml = '';
      if (!currentUser) {
        eventsHtml += `<div class="alert alert-info">Ver quedadas es gratis. Para apuntarte con tu vehículo, <button type="button" id="eventsLoginBtn" style="background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;font-family:inherit">inicia sesión</button>.</div>`;
      }
      eventsHtml += upcoming.length ? upcoming.map(renderEventCard).join('') : '<div class="empty-state">Aún no hay quedadas. Sé el primero en organizar una.</div>';
      eventsList.innerHTML = eventsHtml;
      bindEventCards(eventsList);
      const loginBtn = document.getElementById('eventsLoginBtn');
      if (loginBtn) loginBtn.onclick = () => showAuth('login');
    }

    function renderRoutes() {
      renderRoutesPanel();
      renderEventsPanel();
      renderDrivePanel();
      renderFeed();
      updateHeaderBadge();
    }

    function updateHeaderBadge() {
      const badge = document.getElementById('userBadge');
      if (currentUser) {
        badge.classList.add('logged-in');
        const avatarEl = document.getElementById('headerAvatar');
        if (currentUser.avatarUrl) {
          avatarEl.innerHTML = safeImgUrl(currentUser.avatarUrl)
            ? `<img src="${safeImgUrl(currentUser.avatarUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
            : getInitials(currentUser.name);
        } else {
          avatarEl.textContent = getInitials(currentUser.name);
        }
        document.getElementById('headerName').textContent = currentUser.name.split(' ')[0];
      } else {
        badge.classList.remove('logged-in');
        document.getElementById('headerAvatar').textContent = '?';
        document.getElementById('headerName').textContent = 'Invitado';
      }
      badge.onclick = () => showTab('profile');
    }

    function openVehicleForm(vehicleId = null) {
      editingVehicleId = vehicleId;
      const vehicle = vehicleId
        ? (currentUser?.vehicles || []).find((v) => v.id === vehicleId)
        : null;
      vehicleFormType = coerceVehicleType(vehicle?.type || 'coche');
      vehicleFormPhotoUrl = vehicle?.photoUrl || '';
      document.getElementById('vehicleFormTitle').textContent = vehicle ? 'Editar vehículo' : 'Añadir vehículo';
      document.getElementById('vehicleFormBrand').value = vehicle?.brand || '';
      document.getElementById('vehicleFormModel').value = vehicle?.model || '';
      document.getElementById('vehicleFormYear').value = vehicle?.year ? String(vehicle.year) : '';
      showError(document.getElementById('vehicleFormError'), '');
      document.getElementById('vehicleFormGrid').innerHTML = VEHICLES.map((v) =>
        `<button type="button" class="vehicle-opt vehicle-opt--dual ${v.id === vehicleFormType ? 'active' : ''}" data-vehicle="${v.id}"><span class="vehicle-opt-icon">${v.icon}</span><span class="vehicle-opt-label">${v.label}</span></button>`
      ).join('');
      document.querySelectorAll('#vehicleFormGrid [data-vehicle]').forEach((btn) => {
        btn.onclick = () => {
          vehicleFormType = btn.dataset.vehicle;
          document.querySelectorAll('#vehicleFormGrid [data-vehicle]').forEach((b) =>
            b.classList.toggle('active', b.dataset.vehicle === vehicleFormType));
          renderVehiclePhotoPresets();
        };
      });
      renderVehiclePhotoPresets();
      document.getElementById('vehicleFormModal').classList.add('open');
    }

    function renderVehiclePhotoPresets() {
      const wrap = document.getElementById('vehiclePhotoPresets');
      const preview = document.getElementById('vehiclePhotoPreview');
      if (!wrap) return;
      if (preview) {
        if (vehicleFormPhotoUrl) {
          preview.src = vehicleFormPhotoUrl;
          preview.hidden = false;
        } else {
          preview.removeAttribute('src');
          preview.hidden = true;
        }
      }
      wrap.innerHTML = `
        <button type="button" class="btn btn-primary btn-sm" id="vehiclePhotoUploadBtn">📷 Subir foto de tu vehículo</button>
        ${vehicleFormPhotoUrl ? '<button type="button" class="btn btn-secondary btn-sm" id="vehiclePhotoRemoveBtn">Quitar foto</button>' : ''}
      `;
      document.getElementById('vehiclePhotoUploadBtn')?.addEventListener('click', () => {
        document.getElementById('vehiclePhotoFileInput')?.click();
      });
      document.getElementById('vehiclePhotoRemoveBtn')?.addEventListener('click', () => {
        vehicleFormPhotoUrl = '';
        renderVehiclePhotoPresets();
      });
    }

    function closeVehicleForm() {
      document.getElementById('vehicleFormModal').classList.remove('open');
      editingVehicleId = null;
    }

    function saveVehicleForm() {
      if (!currentUser) return;
      const brand = document.getElementById('vehicleFormBrand').value.trim();
      const model = document.getElementById('vehicleFormModel').value.trim();
      const yearText = document.getElementById('vehicleFormYear').value.trim();
      const formError = validateVehicleForm(brand, model, yearText, vehicleFormPhotoUrl);
      if (formError) return showError(document.getElementById('vehicleFormError'), formError);
      const year = Number(yearText);
      const label = buildVehicleLabel(brand, model, year);
      const type = coerceVehicleType(vehicleFormType);
      const vehicles = [...(currentUser.vehicles || [])];
      const photoUrl = vehicleFormPhotoUrl.trim();
      if (editingVehicleId) {
        const idx = vehicles.findIndex((v) => v.id === editingVehicleId);
        if (idx >= 0) vehicles[idx] = { ...vehicles[idx], type, brand, model, year, label, photoUrl };
      } else {
        vehicles.push({
          id: 'veh_' + Date.now(),
          type, brand, model, year, label, photoUrl,
          isDefault: vehicles.length === 0,
        });
      }
      currentUser.vehicles = normalizeUserVehicles(vehicles);
      syncCurrentUserToStorage();
      closeVehicleForm();
      renderProfile();
      showToast(editingVehicleId ? 'Vehículo actualizado' : 'Vehículo añadido', 'success');
    }

    function removeUserVehicle(vehicleId) {
      if (!currentUser) return;
      currentUser.vehicles = normalizeUserVehicles(
        (currentUser.vehicles || []).filter((v) => v.id !== vehicleId),
      );
      syncCurrentUserToStorage();
      renderProfile();
      showToast('Vehículo eliminado');
    }

    function setDefaultUserVehicle(vehicleId) {
      if (!currentUser) return;
      currentUser.vehicles = normalizeUserVehicles(
        (currentUser.vehicles || []).map((v) => ({ ...v, isDefault: v.id === vehicleId })),
      );
      syncCurrentUserToStorage();
      renderProfile();
      showToast('Vehículo principal actualizado', 'success');
    }

    function renderProfile() {
      const guest = document.getElementById('profileGuest');
      const userPanel = document.getElementById('profileUser');
      renderRoutes();

      if (!currentUser) {
        guest.hidden = false;
        userPanel.hidden = true;
        return;
      }

      const myRoutes = getCustomRoutes().filter((r) => r.creatorEmail === currentUser.email);
      const myMeetups = getCustomMeetups().filter((m) => m.creatorEmail === currentUser.email);
      const mySignups = getSignups().filter((s) => s.userEmail === currentUser.email);

      const myPosts = getFeedPosts().filter((p) => p.authorEmail === currentUser.email).length;
      const completion = getProfileCompletion();

      guest.hidden = true;
      userPanel.hidden = false;

      userPanel.innerHTML = `
        ${completion.percent < 100 ? `<div class="profile-progress">
          <div class="profile-progress-header"><strong>Completa tu perfil</strong><span>${completion.percent}%</span></div>
          <div class="profile-progress-bar"><div class="profile-progress-fill" style="width:${completion.percent}%"></div></div>
          <div class="profile-progress-steps">${completion.steps.map((s) =>
            `<span class="profile-step ${s.done ? 'done' : ''}">${s.done ? '✓' : '○'} ${s.label}</span>`
          ).join('')}</div>
        </div>` : ''}
        <div class="profile-hero">
          ${renderAvatarHtml()}
          <div>
            <div class="profile-name">${currentUser.name}</div>
            <div class="profile-email">${currentUser.email}</div>
            <div class="profile-photo-actions">
              <button type="button" id="changeAvatarBtn">Cambiar foto</button>
              ${currentUser.avatarUrl ? '<button type="button" id="removeAvatarBtn">Quitar foto</button>' : ''}
            </div>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><strong>${myRoutes.length}</strong><span>Rutas creadas</span></div>
          <div class="stat"><strong>${myMeetups.length}</strong><span>Quedadas</span></div>
          <div class="stat"><strong>${mySignups.length}</strong><span>Apuntado</span></div>
          <div class="stat"><strong>${myPosts}</strong><span>Publicaciones</span></div>
        </div>
        ${renderClubApprovalNotificationsHtml()}
        ${(() => {
          const pr = getUserClubCreationRequests(currentUser.email).find((r) => r.status === 'pending');
          if (!pr) return '';
          return `<div class="list-section"><p class="section-title">Petición en estudio</p>
            <div class="club-pending-notice"><strong>«${pr.name}»</strong>
            <p class="hero-text" style="font-size:0.82rem;margin-top:4px">El equipo de Strada está estudiando tu petición. La revisión se envía a administración y te notificaremos aquí cuando haya una decisión.</p></div></div>`;
        })()}
        <div class="list-section">
          <p class="section-title">Mis vehículos</p>
          <p class="hero-text" style="margin-top:-6px;margin-bottom:10px">Coche o moto con marca, modelo y año. Lo eliges al apuntarte.</p>
          ${(currentUser.vehicles || []).length
            ? (currentUser.vehicles || []).map((v) => `<div class="garage-item">
                ${v.photoUrl ? `<img class="gi-thumb" src="${vehiclePhotoUrl(v)}" alt="">` : `<span class="gi-icon">${vehicleIcon(v.type)}</span>`}
                <div class="gi-body"><strong>${vehicleDisplayTitle(v)}</strong><span>${vehicleDisplayMeta(v)}</span></div>
                ${v.isDefault ? '<span class="sv-badge">Principal</span>' : `<button type="button" class="link btn-default-vehicle" data-vehicle-id="${v.id}">Hacer principal</button>`}
                <div class="garage-actions">
                  <button type="button" class="link btn-edit-vehicle" data-vehicle-id="${v.id}">Editar</button>
                  <button type="button" class="danger btn-remove-vehicle" data-vehicle-id="${v.id}">Eliminar</button>
                </div>
              </div>`).join('')
            : '<div class="empty-garage">Aún no has guardado ningún vehículo. Añade tu coche o moto con marca, modelo y año.</div>'}
          <button class="btn btn-secondary profile-action-btn" type="button" id="addVehicleBtn">+ Añadir vehículo</button>
        </div>
        <div class="list-section socials-section">
          <p class="section-title">Redes sociales</p>
          <p class="hero-text" style="margin-top:-6px;margin-bottom:10px">Opcional. Comparte tus perfiles con la comunidad.</p>
          ${SOCIAL_NETWORKS.map((n) => `<div class="field social-field">
            <label>${n.label}</label>
            <div class="social-input-wrap">
              ${n.prefix ? `<span class="social-prefix">${n.prefix}</span>` : ''}
              <input class="field-input social-input" id="social_${n.id}" value="${(currentUser.socials || {})[n.id] || ''}" placeholder="${n.placeholder}" autocomplete="off">
            </div>
          </div>`).join('')}
          <button class="btn btn-secondary profile-action-btn" type="button" id="saveSocialsBtn">Guardar redes</button>
        </div>
        ${(() => {
          const adminHtml = renderAdminClubRequestsHtml('btn-approve-club-req-profile');
          return adminHtml ? `<div class="list-section">${adminHtml}</div>` : '';
        })()}
        ${getPendingClubInvites(currentUser.email).length ? `<div class="list-section"><p class="section-title">Invitaciones a clubes (${getPendingClubInvites(currentUser.email).length})</p><button class="btn btn-secondary profile-action-btn" type="button" id="profileClubInvitesBtn">Ver en Clubes</button></div>` : ''}
        ${myMeetups.length ? `<div class="list-section"><p class="section-title">Mis quedadas organizadas</p>${myMeetups.map((m) => `<div class="list-item" data-meetup-id="${m.id}" style="cursor:pointer"><strong>${m.title}</strong><span>${getMeetupSignups(m.id).length} apuntados · ${formatDate(m.meetingAt)}</span></div>`).join('')}</div>` : ''}
        ${myRoutes.length ? `<div class="list-section"><p class="section-title">Mis rutas publicadas</p>${myRoutes.map((r) => `<div class="list-item" data-route-id="${r.id}" style="cursor:pointer"><strong>${r.title}</strong><span>${getRouteSignups(r.id).length} apuntados · ${r.km} km</span></div>`).join('')}</div>` : ''}
        ${mySignups.length ? `<div class="list-section"><p class="section-title">Donde me he apuntado</p>${mySignups.map((s) => {
          if (s.meetupId) {
            const m = getMeetup(s.meetupId);
            return `<div class="list-item" data-meetup-id="${s.meetupId}" style="cursor:pointer"><strong>${m?.title || 'Quedada'}</strong><span>${vehicleName(s.vehicleType)} · ${s.vehicleLabel}</span></div>`;
          }
          const r = getRoute(s.routeId);
          return `<div class="list-item" data-route-id="${s.routeId}" style="cursor:pointer"><strong>${r?.title || 'Ruta'}</strong><span>${vehicleName(s.vehicleType)} · ${s.vehicleLabel}</span></div>`;
        }).join('')}</div>` : ''}
        <div class="profile-actions">
          <button class="btn btn-secondary profile-action-btn" type="button" id="profilePostBtn">+ Nueva publicación</button>
          <button class="btn btn-secondary profile-action-btn" type="button" id="logoutBtn">Cerrar sesión</button>
        </div>
      `;

      userPanel.querySelectorAll('[data-route-id]').forEach((el) => {
        el.onclick = () => openDetail(el.dataset.routeId);
      });
      userPanel.querySelectorAll('[data-meetup-id]').forEach((el) => {
        el.onclick = () => openMeetupDetail(el.dataset.meetupId);
      });
      document.getElementById('changeAvatarBtn').onclick = () => openAvatarPicker();
      const removeAvatarBtn = document.getElementById('removeAvatarBtn');
      if (removeAvatarBtn) {
        removeAvatarBtn.onclick = () => {
          currentUser.avatarUrl = null;
          syncCurrentUserToStorage();
          renderProfile();
          updateHeaderBadge();
          showToast('Foto de perfil eliminada');
        };
      }
      document.getElementById('addVehicleBtn').onclick = () => openVehicleForm();
      const saveSocialsBtn = document.getElementById('saveSocialsBtn');
      if (saveSocialsBtn) saveSocialsBtn.onclick = saveSocialsFromForm;
      const clubInvBtn = document.getElementById('profileClubInvitesBtn');
      if (clubInvBtn) clubInvBtn.onclick = () => showTab('clubs');
      bindClubApprovalNotifications(userPanel);
      userPanel.querySelectorAll('.btn-approve-club-req-profile').forEach((btn) => {
        btn.onclick = () => {
          const club = approveClubCreationRequest(btn.dataset.requestId);
          if (club) {
            showToast('Club creado', 'success');
            renderProfile();
            renderClubsPanel();
          }
        };
      });
      userPanel.querySelectorAll('.btn-reject-club-req-profile').forEach((btn) => {
        btn.onclick = () => {
          if (rejectClubCreationRequest(btn.dataset.requestId)) {
            showToast('Solicitud rechazada');
            renderProfile();
            renderClubsPanel();
          }
        };
      });
      userPanel.querySelectorAll('.btn-edit-vehicle').forEach((btn) => {
        btn.onclick = () => openVehicleForm(btn.dataset.vehicleId);
      });
      userPanel.querySelectorAll('.btn-remove-vehicle').forEach((btn) => {
        btn.onclick = () => removeUserVehicle(btn.dataset.vehicleId);
      });
      userPanel.querySelectorAll('.btn-default-vehicle').forEach((btn) => {
        btn.onclick = () => setDefaultUserVehicle(btn.dataset.vehicleId);
      });
      document.getElementById('logoutBtn').onclick = logout;
      document.getElementById('profilePostBtn').onclick = () => openCreatePostModal();
    }

    function promptProfileSetupIfNeeded() {
      if (!currentUser || pendingAction) return;
      showTab('profile');
      if (!(currentUser.vehicles || []).length) {
        showToast('Añade tu vehículo en el perfil para apuntarte a rutas', 'success');
      }
    }

    async function login(email, password) {
      if (window.StradaCloud?.isConfigured()) {
        assertValidEmail(email);
        assertLoginAllowed();
        try {
          const user = await window.StradaCloud.signIn(email, password);
          clearLoginAttempts();
          currentUser = user;
          showApp();
          renderProfile();
          syncUserClubChats();
          runPendingAction();
          if (!pendingAction) {
            showToast('Sesión iniciada', 'success');
            promptProfileSetupIfNeeded();
          }
        } catch (ex) {
          recordFailedLogin();
          throw ex;
        }
        return;
      }
      assertValidEmail(email);
      assertLoginAllowed();
      const key = normalizeEmail(email);
      const found = getUsers().find((u) => u.email === key);
      if (!found || found.passwordHash !== hashPassword(password)) {
        recordFailedLogin();
        throw new Error('Correo o contraseña incorrectos.');
      }
      clearLoginAttempts();
      currentUser = userFromRecord(found);
      setSession(currentUser);
      showApp();
      renderProfile();
      syncUserClubChats();
      runPendingAction();
      if (!pendingAction) {
        showToast('Sesión iniciada', 'success');
        promptProfileSetupIfNeeded();
      }
    }

    async function register(name, email, password) {
      if (window.StradaCloud?.isConfigured()) {
        assertValidEmail(email);
        if (!isStrongPassword(password)) {
          throw new Error('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.');
        }
        const user = await window.StradaCloud.signUp(name, email, password);
        currentUser = user;
        showApp();
        renderProfile();
        syncUserClubChats();
        runPendingAction();
        showToast('Cuenta creada', 'success');
        if (!pendingAction) promptProfileSetupIfNeeded();
        return;
      }
      assertValidEmail(email);
      if (!isStrongPassword(password)) {
        throw new Error('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.');
      }
      const key = normalizeEmail(email);
      const users = getUsers();
      if (users.some((u) => u.email === key)) throw new Error('Ya existe una cuenta con ese correo.');
      users.push({
        name: name.trim(),
        email: key,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        vehicles: [],
        socials: emptySocials(),
      });
      saveUsers(users);
      currentUser = userFromRecord(users[users.length - 1]);
      setSession(currentUser);
      showApp();
      renderProfile();
      syncUserClubChats();
      runPendingAction();
      showToast('Cuenta creada', 'success');
      if (!pendingAction) promptProfileSetupIfNeeded();
    }

    async function logout() {
      if (window.StradaCloud?.isActive()) {
        await window.StradaCloud.signOut();
      }
      currentUser = null;
      if (!window.StradaCloud?.isConfigured()) setSession(null);
      pendingAction = null;
      document.getElementById('groupPanel').setAttribute('hidden', '');
      document.getElementById('toggleShare').textContent = 'Compartir ubicación (grupo)';
      showApp();
      renderProfile();
      showTab('explore');
      showToast('Sesión cerrada');
    }

    async function restoreSession() {
      if (window.StradaCloud?.isConfigured()) {
        const user = await window.StradaCloud.restoreSession();
        if (user) currentUser = user;
        syncUserClubChats();
        return;
      }
      const session = getSession();
      if (!session?.email) return;
      const found = getUsers().find((u) => u.email === session.email);
      if (!found) return;
      currentUser = userFromRecord(found);
      syncUserClubChats();
    }

    function showTab(tab) {
      closeModals();
      document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab));
      document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
      document.querySelectorAll('#sidebarNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
      document.getElementById('screenTitle').textContent = titles[tab];
      if (document.getElementById('detailShell').classList.contains('open')) closeDetail();
      if (document.getElementById('chatShell').classList.contains('open')) closeChatThread();
      if (document.getElementById('clubShell').classList.contains('open')) closeClubDetail();
      const content = document.querySelector('#mainShell .content');
      if (content) content.scrollTop = 0;
      if (tab === 'drive') setTimeout(initDriveMap, 120);
      if (tab === 'explore') renderFeed();
      if (tab === 'routes') renderRoutesPanel();
      if (tab === 'events') renderEventsPanel();
      if (tab === 'clubs') { renderClubsPanel(); notifyUnreadClubApprovals(); }
      if (tab === 'profile') { renderProfile(); notifyUnreadClubApprovals(); }
      if (tab === 'chats') renderChatsPanel();
    }

    function openMeetupDetail(id) {
      const meetup = getMeetup(id);
      if (!meetup) return;
      const route = meetup.routeId ? getRoute(meetup.routeId) : null;
      const signups = getMeetupSignups(id);
      const signedUp = currentUser && signups.some((s) => s.userEmail === currentUser.email);
      const isFull = meetup.maxAttendees && signups.length >= meetup.maxAttendees;
      const mySignup = signedUp ? signups.find((s) => s.userEmail === currentUser.email) : null;
      const nav = meetupNavPoint(meetup);
      const mode = meetupVehicleMode(meetup);
      const joinLabel = meetupJoinButtonLabel(meetup, signups);
      const pendingBlock = renderPendingRequestsBlock({
        meetupId: id,
        creatorEmail: meetup.creatorEmail,
      });
      const groupChat = getChatForMeetup(id);
      const inChat = currentUser && groupChat && groupChat.participantEmails.some((e) => e.toLowerCase() === currentUser.email.toLowerCase());

      closeModals();
      document.getElementById('mainShell').classList.add('hidden');
      document.getElementById('detailShell').classList.add('open');

      document.getElementById('detailContent').innerHTML = `
        <div class="route-cover" style="margin:-16px -16px 14px;border-radius:0">
          <img src="${meetupCover(meetup)}" alt="Quedada ${meetup.title}">
        </div>
        <p class="kicker">Quedada · ${routeVehicleModeIcon(mode)} ${routeVehicleModeLabel(mode)}</p>
        <p class="join-mode-line">${joinModeDetail(meetup)}</p>
        <h3 class="hero-title" style="font-size:1.3rem">${meetup.title}</h3>
        <p class="hero-text">${meetup.desc}</p>
        <p class="hero-text">Organiza: <strong>${meetup.creatorName || 'Comunidad'}</strong></p>
        <div class="mode-card"><h3>Encuentro</h3><p><strong>${formatDate(meetup.meetingAt)}</strong></p><p>📍 ${meetup.meetingPoint}</p><p>👥 ${signups.length} / ${meetup.maxAttendees || '∞'} plazas</p>
          <div class="nav-row" style="margin-top:10px">
            <button type="button" class="btn btn-primary btn-sm" id="detailGoMeeting">📍 Ir a la quedada</button>
            <button type="button" class="btn btn-secondary btn-sm" id="detailGoWaze">Waze</button>
          </div></div>
        ${route ? `<p class="section-title">Ruta vinculada</p>
          <div class="card community" style="cursor:pointer;margin-bottom:12px" id="detailLinkedRoute">
            <div class="card-top"><span class="card-title">${route.title}</span><span class="card-meta">${route.km} km</span></div>
            <p class="card-desc">${route.region} · ${formatDuration(route.min)}</p>
          </div>` : ''}
        <button class="btn btn-primary" type="button" id="detailJoinMeetupBtn" ${currentUser && !signedUp && isFull && !getUserPendingJoinRequest({ meetupId: id }) ? 'disabled' : ''}>${joinLabel}</button>
        ${inChat ? `<button class="btn btn-secondary" type="button" id="detailOpenChat">💬 Abrir chat del grupo</button>` : ''}
        ${route ? `<button class="btn btn-secondary" type="button" id="detailOpenRoute">Ver ruta completa</button>` : ''}
        ${pendingBlock}
        <p class="section-title">Apuntados (${signups.length})</p>
        ${signups.length ? signups.map((s) => `<div class="attendee-row"><strong>${s.userName}</strong><span>${vehicleName(s.vehicleType)}<br>${s.vehicleLabel}</span></div>`).join('') : '<div class="empty-state">Sé el primero en apuntarte</div>'}
      `;

      document.getElementById('detailJoinMeetupBtn').onclick = () => handleMeetupJoinClick(id);
      const openChatBtn = document.getElementById('detailOpenChat');
      if (openChatBtn) openChatBtn.onclick = () => openChatThread(groupChat.id);
      bindPendingRequestActions();
      document.getElementById('detailGoMeeting').onclick = () => openNavigation(nav.lat, nav.lng, nav.label, 'google');
      document.getElementById('detailGoWaze').onclick = () => openNavigation(nav.lat, nav.lng, nav.label, 'waze');
      const linked = document.getElementById('detailLinkedRoute');
      if (linked) linked.onclick = () => openDetail(route.id, { routeOnly: true });
      const openRoute = document.getElementById('detailOpenRoute');
      if (openRoute) openRoute.onclick = () => openDetail(route.id, { routeOnly: true });
    }

    function handleMeetupJoinClick(meetupId) {
      if (!currentUser) { requireAuth({ type: 'joinMeetup', meetupId }); return; }
      const signups = getMeetupSignups(meetupId);
      if (signups.some((s) => s.userEmail === currentUser.email)) {
        const meetup = getMeetup(meetupId);
        saveSignups(getSignups().filter((s) => !(s.meetupId === meetupId && s.userEmail === currentUser.email)));
        if (meetup) syncChatParticipant({ meetupId, routeId: meetup.routeId, title: meetup.title, creatorEmail: meetup.creatorEmail }, currentUser.email, currentUser.name, false);
        openMeetupDetail(meetupId);
        renderRoutes();
        showToast('Apunte cancelado');
        return;
      }
      const pending = getUserPendingJoinRequest({ meetupId });
      if (pending) {
        cancelUserJoinRequest({ meetupId });
        openMeetupDetail(meetupId);
        renderRoutes();
        showToast('Solicitud cancelada');
        return;
      }
      const meetup = getMeetup(meetupId);
      if (meetup.maxAttendees && signups.length >= meetup.maxAttendees) {
        showToast('Quedada completa');
        return;
      }
      openJoinModalForMeetup(meetupId);
    }

    function openDetail(id, opts = {}) {
      const r = getRoute(id);
      if (!r) return;
      const linkedMeetup = !opts.routeOnly && getMeetupForRoute(id);
      if (linkedMeetup) {
        openMeetupDetail(linkedMeetup.id);
        return;
      }
      const signups = getRouteSignups(id);
      const signedUp = currentUser && signups.some((s) => s.userEmail === currentUser.email);
      const isFull = r.maxAttendees && signups.length >= r.maxAttendees;
      const joinLabel = routeJoinButtonLabel(r, signups);
      const pendingBlock = renderPendingRequestsBlock({
        routeId: id,
        creatorEmail: r.creatorEmail,
      });

      closeModals();
      document.getElementById('mainShell').classList.add('hidden');
      document.getElementById('detailShell').classList.add('open');

      document.getElementById('detailContent').innerHTML = `
        <div class="route-cover" style="margin:-16px -16px 14px;border-radius:0">
          <img src="${getRouteCover(r)}" alt="Vista previa de ${r.title}">
        </div>
        <p class="kicker">${r.region}</p>
        ${r.meetingAt ? `<p class="join-mode-line">${joinModeDetail(r)}</p>` : ''}
        <h3 class="hero-title" style="font-size:1.3rem">${r.title}</h3>
        <p class="hero-text">${r.desc}</p>
        <p class="hero-text">Organiza: <strong>${r.creatorName || 'Comunidad'}</strong> · ${routeVehicleModeIcon(r.vehicleMode)} ${routeVehicleModeLabel(r.vehicleMode)}</p>
        <div class="stats">
          <div class="stat"><strong>${r.km} km</strong><span>Distancia</span></div>
          <div class="stat"><strong>${formatDuration(r.min)}</strong><span>Duración</span></div>
          <div class="stat"><strong class="tag ${levelTagClass(r.level)}" style="display:inline-block;padding:4px 8px;border-radius:999px;font-size:0.75rem">${r.level}</strong><span>Nivel</span></div>
        </div>
        ${r.meetingAt ? `<div class="mode-card"><h3>Quedada</h3><p><strong>${formatDate(r.meetingAt)}</strong></p><p>📍 ${r.meetingPoint}</p><p>👥 ${signups.length} / ${r.maxAttendees} plazas</p>
          <div class="nav-row" style="margin-top:10px">
            <button type="button" class="btn btn-primary btn-sm" id="detailGoMeeting">📍 Ir a la quedada</button>
            <button type="button" class="btn btn-secondary btn-sm" id="detailGoWaze">Waze</button>
          </div></div>` : ''}
        <p class="section-title">Paradas (${r.stops.length})</p>
        ${r.stops.map((s, i) => `<div class="stop"><div class="stop-num">${i + 1}</div><div class="stop-name">${s}</div></div>`).join('')}
        <button class="btn btn-primary" type="button" id="detailOpenMaps">Abrir ruta en Maps</button>
        <button class="btn btn-secondary btn-sm" type="button" id="detailShareBtn">Compartir ruta</button>
        ${r.meetingAt ? `<button class="btn btn-secondary" type="button" id="detailJoinBtn" ${currentUser && !signedUp && isFull && !getUserPendingJoinRequest({ routeId: id }) ? 'disabled' : ''}>${joinLabel}</button>` : ''}
        ${pendingBlock}
        <p class="section-title">Conductores apuntados (${signups.length})</p>
        ${signups.length ? signups.map((s) => `<div class="attendee-row"><strong>${s.userName}</strong><span>${vehicleName(s.vehicleType)}<br>${s.vehicleLabel}</span></div>`).join('') : '<div class="empty-state">Sé el primero en apuntarte</div>'}
      `;

      const joinBtn = document.getElementById('detailJoinBtn');
      if (joinBtn) joinBtn.onclick = () => handleJoinClick(id);
      bindPendingRequestActions();
      const goMeeting = document.getElementById('detailGoMeeting');
      if (goMeeting) goMeeting.onclick = () => openNavigation(r.meetingLat, r.meetingLng, r.meetingPoint, 'google');
      const goWaze = document.getElementById('detailGoWaze');
      if (goWaze) goWaze.onclick = () => openNavigation(r.meetingLat, r.meetingLng, r.meetingPoint, 'waze');
      const openMaps = document.getElementById('detailOpenMaps');
      if (openMaps) {
        openMaps.onclick = () => {
          const path = getRoutePath(r);
          const dest = path[path.length - 1];
          openNavigation(dest[0], dest[1], r.title, 'google');
        };
      }
      const shareBtn = document.getElementById('detailShareBtn');
      if (shareBtn) {
        shareBtn.onclick = async () => {
          const text = `${r.title} — ${r.km} km · ${r.region}`;
          try {
            if (navigator.share) await navigator.share({ title: r.title, text });
            else { await navigator.clipboard.writeText(text); showToast('Ruta copiada al portapapeles', 'success'); }
          } catch { showToast('No se pudo compartir'); }
        };
      }
    }

    function handleJoinClick(routeId) {
      if (!currentUser) { requireAuth({ type: 'join', routeId }); return; }
      const signups = getRouteSignups(routeId);
      if (signups.some((s) => s.userEmail === currentUser.email)) {
        const r = getRoute(routeId);
        saveSignups(getSignups().filter((s) => !(s.routeId === routeId && s.userEmail === currentUser.email)));
        if (r) syncChatParticipant({ routeId, title: r.title, creatorEmail: r.creatorEmail }, currentUser.email, currentUser.name, false);
        openDetail(routeId, { routeOnly: true });
        renderRoutes();
        showToast('Apunte cancelado');
        return;
      }
      const pending = getUserPendingJoinRequest({ routeId });
      if (pending) {
        cancelUserJoinRequest({ routeId });
        openDetail(routeId, { routeOnly: true });
        renderRoutes();
        showToast('Solicitud cancelada');
        return;
      }
      const r = getRoute(routeId);
      if (r.maxAttendees && signups.length >= r.maxAttendees) {
        showToast('Ruta completa');
        return;
      }
      openJoinModal(routeId);
    }

    function openJoinModal(routeId) {
      joinRouteId = routeId;
      joinMeetupId = null;
      const route = getRoute(routeId);
      const isRequest = route && !isJoinOpen(route);
      document.getElementById('joinModalHeading').textContent = isRequest ? 'Solicitar unirse a la ruta' : 'Apuntarse a la ruta';
      setJoinModalRequestMode(isRequest);
      document.getElementById('joinRouteTitle').textContent = route?.title || '';
      showError(document.getElementById('joinError'), '');
      const vehicles = currentUser?.vehicles || [];
      const noVehiclesEl = document.getElementById('joinNoVehicles');
      const listEl = document.getElementById('savedVehiclesList');
      const confirmBtn = document.getElementById('confirmJoin');

      if (!vehicles.length) {
        noVehiclesEl.hidden = false;
        noVehiclesEl.innerHTML = 'Aún no tienes vehículos guardados. Añade al menos uno en tu perfil.\n              <button type="button" class="btn btn-secondary btn-sm" id="joinGoProfile" style="margin-top:10px">Ir a mi perfil</button>';
        listEl.innerHTML = '';
        selectedSavedVehicleId = null;
        confirmBtn.disabled = true;
        document.getElementById('joinGoProfile').onclick = () => {
          closeJoinModal();
          showTab('profile');
        };
      } else {
        const route = getRoute(routeId);
        const compatible = vehicles.filter((v) => vehicleMatchesRoute(route, v.type));
        populateJoinVehicleList(compatible, route);
      }

      document.getElementById('joinModal').classList.add('open');
    }

    function openJoinModalForMeetup(meetupId) {
      joinMeetupId = meetupId;
      joinRouteId = null;
      const meetup = getMeetup(meetupId);
      const isRequest = meetup && !isJoinOpen(meetup);
      document.getElementById('joinModalHeading').textContent = isRequest ? 'Solicitar unirse a la quedada' : 'Apuntarse a la quedada';
      setJoinModalRequestMode(isRequest);
      document.getElementById('joinRouteTitle').textContent = meetup?.title || '';
      showError(document.getElementById('joinError'), '');
      const vehicles = currentUser?.vehicles || [];
      const noVehiclesEl = document.getElementById('joinNoVehicles');
      const listEl = document.getElementById('savedVehiclesList');
      const confirmBtn = document.getElementById('confirmJoin');
      const mode = meetupVehicleMode(meetup);

      if (!vehicles.length) {
        noVehiclesEl.hidden = false;
        noVehiclesEl.innerHTML = 'Aún no tienes vehículos guardados. Añade al menos uno en tu perfil.\n              <button type="button" class="btn btn-secondary btn-sm" id="joinGoProfile" style="margin-top:10px">Ir a mi perfil</button>';
        listEl.innerHTML = '';
        selectedSavedVehicleId = null;
        confirmBtn.disabled = true;
        document.getElementById('joinGoProfile').onclick = () => {
          closeJoinModal();
          showTab('profile');
        };
      } else {
        const compatible = vehicles.filter((v) => vehicleMatchesRoute({ vehicleMode: mode }, v.type));
        populateJoinVehicleList(compatible, { vehicleMode: mode });
      }

      document.getElementById('joinModal').classList.add('open');
    }

    function populateJoinVehicleList(compatible, routeLike) {
      const noVehiclesEl = document.getElementById('joinNoVehicles');
      const listEl = document.getElementById('savedVehiclesList');
      const confirmBtn = document.getElementById('confirmJoin');
      if (!compatible.length) {
        noVehiclesEl.hidden = false;
        noVehiclesEl.innerHTML = `Esta quedada es <strong>${routeVehicleModeLabel(routeLike.vehicleMode)}</strong>. Añade un vehículo compatible en tu perfil.
              <button type="button" class="btn btn-secondary btn-sm" id="joinGoProfile" style="margin-top:10px">Ir a mi perfil</button>`;
        listEl.innerHTML = '';
        selectedSavedVehicleId = null;
        confirmBtn.disabled = true;
        document.getElementById('joinGoProfile').onclick = () => {
          closeJoinModal();
          showTab('profile');
        };
      } else {
        noVehiclesEl.hidden = true;
        const defaultVehicle = compatible.find((v) => v.isDefault) || compatible[0];
        selectedSavedVehicleId = defaultVehicle.id;
        listEl.innerHTML = compatible.map((v) =>
          `<button type="button" class="saved-vehicle ${v.id === selectedSavedVehicleId ? 'active' : ''}" data-vehicle-id="${v.id}">
            <span class="sv-icon">${vehicleIcon(v.type)}</span>
            <span class="sv-body"><strong>${vehicleDisplayTitle(v)}</strong><span>${vehicleDisplayMeta(v)}</span></span>
            ${v.isDefault ? '<span class="sv-badge">Principal</span>' : ''}
          </button>`
        ).join('');
        listEl.querySelectorAll('[data-vehicle-id]').forEach((btn) => {
          btn.onclick = () => {
            selectedSavedVehicleId = btn.dataset.vehicleId;
            listEl.querySelectorAll('[data-vehicle-id]').forEach((b) =>
              b.classList.toggle('active', b.dataset.vehicleId === selectedSavedVehicleId));
          };
        });
        confirmBtn.disabled = false;
      }
    }

    function closeJoinModal() {
      document.getElementById('joinModal').classList.remove('open');
      joinRouteId = null;
      joinMeetupId = null;
    }

    function confirmJoin() {
      const vehicles = currentUser?.vehicles || [];
      const picked = vehicles.find((v) => v.id === selectedSavedVehicleId);
      if (!picked) return showError(document.getElementById('joinError'), 'Elige un vehículo de tu perfil.');

      if (joinMeetupId) {
        const meetup = getMeetup(joinMeetupId);
        const mode = meetupVehicleMode(meetup);
        if (meetup && !vehicleMatchesRoute({ vehicleMode: mode }, picked.type)) {
          return showError(document.getElementById('joinError'), `Esta quedada es ${routeVehicleModeLabel(mode)}. Elige un vehículo compatible.`);
        }
        const meetupId = joinMeetupId;
        const isRequest = meetup && !isJoinOpen(meetup);
        if (isRequest) {
          const existing = getUserPendingJoinRequest({ meetupId });
          if (!existing) {
            saveJoinRequests([...getJoinRequests(), {
              id: 'jr_' + Date.now(),
              meetupId,
              routeId: meetup?.routeId,
              userEmail: currentUser.email,
              userName: currentUser.name,
              vehicleType: picked.type,
              vehicleLabel: picked.label,
              status: 'pending',
              createdAt: new Date().toISOString(),
            }]);
          }
          closeJoinModal();
          openMeetupDetail(meetupId);
          renderRoutes();
          showToast('Solicitud enviada — el organizador la revisará', 'success');
          return;
        }
        saveSignups([...getSignups(), {
          id: 'su_' + Date.now(), meetupId, routeId: meetup?.routeId, userEmail: currentUser.email, userName: currentUser.name,
          vehicleType: picked.type, vehicleLabel: picked.label, joinedAt: new Date().toISOString(),
        }]);
        if (meetup) {
          ensureMeetupChat(meetup);
          syncChatParticipant({ meetupId, routeId: meetup.routeId, title: meetup.title, creatorEmail: meetup.creatorEmail }, currentUser.email, currentUser.name, true);
        }
        closeJoinModal();
        openMeetupDetail(meetupId);
        renderRoutes();
        showToast(`Apuntado con ${vehicleName(picked.type)} · ${picked.label}`, 'success');
        return;
      }

      const routeId = joinRouteId;
      const joinRoute = getRoute(routeId);
      if (joinRoute && !vehicleMatchesRoute(joinRoute, picked.type)) {
        return showError(document.getElementById('joinError'), `Esta ruta es ${routeVehicleModeLabel(joinRoute.vehicleMode)}. Elige un vehículo compatible.`);
      }
      const isRequest = joinRoute && !isJoinOpen(joinRoute);
      if (isRequest) {
        const existing = getUserPendingJoinRequest({ routeId });
        if (!existing) {
          saveJoinRequests([...getJoinRequests(), {
            id: 'jr_' + Date.now(),
            routeId,
            userEmail: currentUser.email,
            userName: currentUser.name,
            vehicleType: picked.type,
            vehicleLabel: picked.label,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }]);
        }
        closeJoinModal();
        openDetail(routeId, { routeOnly: true });
        renderRoutes();
        showToast('Solicitud enviada — el organizador la revisará', 'success');
        return;
      }
      saveSignups([...getSignups(), {
        id: 'su_' + Date.now(), routeId, userEmail: currentUser.email, userName: currentUser.name,
        vehicleType: picked.type, vehicleLabel: picked.label, joinedAt: new Date().toISOString(),
      }]);
      if (joinRoute) {
        ensureRouteChat(joinRoute);
        syncChatParticipant({ routeId, title: joinRoute.title, creatorEmail: joinRoute.creatorEmail }, currentUser.email, currentUser.name, true);
      }
      closeJoinModal();
      openDetail(routeId);
      renderRoutes();
      showToast(`Apuntado con ${vehicleName(picked.type)} · ${picked.label}`, 'success');
    }

    function bindCreateRouteVehicleMode() {
      const wrap = document.getElementById('crVehicleMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.onclick = () => {
          createRouteVehicleMode = btn.dataset.mode;
          wrap.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === createRouteVehicleMode));
        };
      });
    }

    function bindCreateMeetupVehicleMode() {
      const wrap = document.getElementById('cmVehicleMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.onclick = () => {
          createMeetupVehicleMode = btn.dataset.mode;
          wrap.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === createMeetupVehicleMode));
        };
      });
    }

    function bindCreateRouteJoinMode() {
      const wrap = document.getElementById('crJoinMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-join]').forEach((btn) => {
        btn.onclick = () => {
          createRouteJoinMode = btn.dataset.join;
          wrap.querySelectorAll('[data-join]').forEach((b) => b.classList.toggle('active', b.dataset.join === createRouteJoinMode));
        };
      });
    }

    function bindCreateMeetupJoinMode() {
      const wrap = document.getElementById('cmJoinMode');
      if (!wrap || wrap.dataset.bound === '1') return;
      wrap.dataset.bound = '1';
      wrap.querySelectorAll('[data-join]').forEach((btn) => {
        btn.onclick = () => {
          createMeetupJoinMode = btn.dataset.join;
          wrap.querySelectorAll('[data-join]').forEach((b) => b.classList.toggle('active', b.dataset.join === createMeetupJoinMode));
        };
      });
    }

    function openCreateMeetupModal() {
      if (!currentUser) return;
      pendingMeetupImage = null;
      document.getElementById('createMeetupForm').reset();
      const preview = document.getElementById('cmCoverPreview');
      preview.classList.remove('visible');
      preview.src = '';
      document.getElementById('meetupFileLabel').textContent = '📷 Foto de portada (opcional)';
      createMeetupVehicleMode = 'mixto';
      createMeetupJoinMode = 'open';
      bindCreateMeetupVehicleMode();
      bindCreateMeetupJoinMode();
      document.querySelectorAll('#cmVehicleMode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'mixto'));
      document.querySelectorAll('#cmJoinMode [data-join]').forEach((b) => b.classList.toggle('active', b.dataset.join === 'open'));
      const routeSelect = document.getElementById('cmRoute');
      routeSelect.innerHTML = '<option value="">Sin ruta — solo quedada</option>' +
        getAllRoutes().map((r) => `<option value="${r.id}">${r.title} (${r.region})</option>`).join('');
      document.getElementById('createMeetupModal').classList.add('open');
      showError(document.getElementById('createMeetupError'), '');
    }

    function closeCreateMeetupModal() {
      document.getElementById('createMeetupModal').classList.remove('open');
      pendingMeetupImage = null;
    }

    function openCreateRouteModal() {
      if (!currentUser) return;
      pendingRouteImage = null;
      document.getElementById('createRouteForm').reset();
      const preview = document.getElementById('crCoverPreview');
      preview.classList.remove('visible');
      preview.src = '';
      document.getElementById('routeFileLabel').textContent = '📷 Foto de previsualización *';
      createRouteVehicleMode = 'mixto';
      createRouteJoinMode = 'open';
      bindCreateRouteVehicleMode();
      bindCreateRouteJoinMode();
      document.querySelectorAll('#crVehicleMode [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'mixto'));
      document.querySelectorAll('#crJoinMode [data-join]').forEach((b) => b.classList.toggle('active', b.dataset.join === 'open'));
      document.getElementById('createRouteModal').classList.add('open');
      showError(document.getElementById('createRouteError'), '');
    }

    function closeCreateRouteModal() {
      document.getElementById('createRouteModal').classList.remove('open');
      pendingRouteImage = null;
    }

    function closeDetail() {
      document.getElementById('detailShell').classList.remove('open');
      document.getElementById('mainShell').classList.remove('hidden');
    }

    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const loginErr = document.getElementById('loginError');
      const loginEmail = document.getElementById('loginEmail').value;
      if (!isValidEmail(loginEmail)) return showError(loginErr, 'Introduce un correo válido con dominio completo (ej. tu@correo.com).');
      try {
        await login(loginEmail, document.getElementById('loginPassword').value);
        showError(loginErr, '');
      } catch (ex) { showError(loginErr, ex.message); }
    };

    document.getElementById('registerForm').onsubmit = async (e) => {
      e.preventDefault();
      const err = document.getElementById('registerError');
      const regEmail = document.getElementById('regEmail').value;
      const pw = document.getElementById('regPassword').value;
      if (!isValidEmail(regEmail)) return showError(err, 'Introduce un correo válido con dominio completo (ej. tu@correo.com).');
      if (!isStrongPassword(pw)) return showError(err, 'La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.');
      if (pw !== document.getElementById('regConfirm').value) return showError(err, 'Las contraseñas no coinciden.');
      if (!termsAccepted) return showError(err, 'Acepta los términos.');
      try {
        await register(document.getElementById('regName').value, regEmail, pw);
        showError(err, '');
      } catch (ex) { showError(err, ex.message); }
    };

    document.getElementById('createMeetupForm').onsubmit = (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const err = document.getElementById('createMeetupError');
      const routeId = document.getElementById('cmRoute').value || undefined;
      const linkedRoute = routeId ? getRoute(routeId) : null;
      const meetups = getCustomMeetups();
      const id = 'meetup_' + Date.now();
      meetups.unshift({
        id,
        title: document.getElementById('cmTitle').value.trim(),
        desc: document.getElementById('cmDesc').value.trim(),
        routeId,
        meetingAt: new Date(document.getElementById('cmDate').value).toISOString(),
        meetingPoint: document.getElementById('cmMeet').value.trim(),
        meetingLat: linkedRoute?.meetingLat ?? 40.4168,
        meetingLng: linkedRoute?.meetingLng ?? -3.7038,
        maxAttendees: Number(document.getElementById('cmMax').value) || 20,
        vehicleMode: createMeetupVehicleMode,
        coverImage: pendingMeetupImage || linkedRoute?.coverImage,
        creatorName: currentUser.name,
        creatorEmail: currentUser.email,
        joinMode: createMeetupJoinMode,
        createdAt: new Date().toISOString(),
      });
      saveCustomMeetups(meetups);
      ensureMeetupChat(meetups[0]);
      closeCreateMeetupModal();
      pendingMeetupImage = null;
      document.getElementById('createMeetupForm').reset();
      renderRoutes();
      showTab('events');
      openMeetupDetail(id);
      showToast('Quedada publicada', 'success');
    };

    document.getElementById('cmCover').onchange = async (e) => {
      const file = e.target.files?.[0];
      const err = document.getElementById('createMeetupError');
      if (!file) return;
      if (!file.type.startsWith('image/')) return showError(err, 'El archivo debe ser una imagen.');
      try {
        pendingMeetupImage = await compressImage(file, 1000, 0.78);
        const preview = document.getElementById('cmCoverPreview');
        preview.src = pendingMeetupImage;
        preview.classList.add('visible');
        document.getElementById('meetupFileLabel').textContent = '✓ Foto seleccionada — toca para cambiar';
        showError(err, '');
      } catch {
        showError(err, 'No se pudo procesar la imagen.');
      }
    };

    document.getElementById('createRouteForm').onsubmit = (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const err = document.getElementById('createRouteError');
      const stops = document.getElementById('crStops').value.split('\n').map((s) => s.trim()).filter(Boolean);
      const km = Number(document.getElementById('crKm').value);
      const min = Number(document.getElementById('crMin').value);
      if (!pendingRouteImage) return showError(err, 'Añade una foto de previsualización de la ruta.');
      if (!stops.length) return showError(err, 'Añade al menos una parada.');
      if (!km || !min) return showError(err, 'Distancia y duración inválidas.');
      const id = 'custom_' + Date.now();
      const custom = getCustomRoutes();
      custom.unshift({
        id,
        title: document.getElementById('crTitle').value.trim(),
        region: document.getElementById('crRegion').value.trim(),
        coverImage: pendingRouteImage,
        desc: document.getElementById('crDesc').value.trim(),
        km, min, level: 'media', stops,
        meetingLat: 40.4168,
        meetingLng: -3.7038,
        path: [[40.4168, -3.7038], [40.45, -3.75], [40.48, -3.78]],
        navInstruction: 'Dirígete al punto de encuentro',
        navNextKm: 2.0,
        creatorName: currentUser.name,
        creatorEmail: currentUser.email,
        vehicleMode: createRouteVehicleMode,
        joinMode: createRouteJoinMode,
      });
      saveCustomRoutes(custom);
      closeCreateRouteModal();
      pendingRouteImage = null;
      document.getElementById('createRouteForm').reset();
      renderRoutes();
      openDetail(id);
      showToast('Ruta publicada', 'success');
    };

    document.getElementById('termsRow').onclick = () => {
      termsAccepted = !termsAccepted;
      document.getElementById('termsCheck').classList.toggle('on', termsAccepted);
      document.getElementById('termsCheck').textContent = termsAccepted ? '✓' : '';
    };

    document.getElementById('goRegister').onclick = () => showAuth('register');
    document.getElementById('goLogin').onclick = () => showAuth('login');
    document.getElementById('backFromLogin').onclick = () => { pendingAction = null; showApp(); };
    document.getElementById('backFromRegister').onclick = () => showAuth('login');
    document.getElementById('profileLoginBtn').onclick = () => showAuth('login');
    document.getElementById('profileRegisterBtn').onclick = () => showAuth('register');
    document.getElementById('closeJoin').onclick = closeJoinModal;
    document.getElementById('confirmJoin').onclick = confirmJoin;
    document.getElementById('joinManageVehicles').onclick = () => {
      closeJoinModal();
      showTab('profile');
    };
    document.getElementById('closeVehicleForm').onclick = closeVehicleForm;
    document.getElementById('saveVehicleBtn').onclick = saveVehicleForm;

    document.getElementById('avatarFileInput').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !currentUser) return;
      try {
        currentUser.avatarUrl = await compressImage(file, 400, 0.8);
        syncCurrentUserToStorage();
        closeModals();
        renderProfile();
        updateHeaderBadge();
        showToast('Foto de perfil actualizada', 'success');
      } catch {
        showToast('No se pudo cargar la imagen');
      }
      e.target.value = '';
    };

    document.getElementById('vehiclePhotoFileInput').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        vehicleFormPhotoUrl = await compressImage(file, 1200, 0.82);
        renderVehiclePhotoPresets();
        showError(document.getElementById('vehicleFormError'), '');
      } catch {
        showError(document.getElementById('vehicleFormError'), 'No se pudo cargar la imagen.');
      }
      e.target.value = '';
    };

    document.getElementById('closeCreateRoute').onclick = closeCreateRouteModal;
    document.getElementById('closeCreateMeetup').onclick = closeCreateMeetupModal;
    document.getElementById('closeCreatePost').onclick = closeCreatePostModal;
    document.getElementById('backBtn').onclick = closeDetail;
    document.getElementById('clubBackBtn').onclick = closeClubDetail;
    document.getElementById('closeCreateClub').onclick = closeCreateClubModal;
    document.getElementById('createClubForm').onsubmit = (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const err = document.getElementById('createClubError');
      const name = document.getElementById('ccName').value.trim();
      const desc = document.getElementById('ccDesc').value.trim();
      if (!name || !desc) return showError(err, 'Completa nombre y descripción.');
      const finish = () => {
        const result = submitClubCreationRequest({
          name,
          description: desc,
          vehicleMode: createClubVehicleMode,
          latitude: userGeo.lat ?? DEFAULT_GEO.lat,
          longitude: userGeo.lng ?? DEFAULT_GEO.lng,
          locationLabel: 'Tu zona',
        });
        if (!result.ok) return showError(err, result.error);
        showError(err, '');
        closeCreateClubModal();
        showTab('clubs');
        renderClubsPanel();
        showToast('Solicitud enviada. El equipo de Strada la está estudiando.', 'success');
      };
      if (userGeo.lat != null) finish();
      else requestUserLocation(finish);
    };
    document.getElementById('chatBackBtn').onclick = closeChatThread;
    document.getElementById('chatSendBtn').onclick = () => {
      const input = document.getElementById('chatInput');
      if (sendChatMessage(activeChatId, input.value)) {
        input.value = '';
        renderChatThread();
      }
    };
    document.getElementById('chatInput').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('chatSendBtn').click();
      }
    };

    document.getElementById('crCover').onchange = async (e) => {
      const file = e.target.files?.[0];
      const err = document.getElementById('createRouteError');
      if (!file) return;
      if (!file.type.startsWith('image/')) return showError(err, 'El archivo debe ser una imagen.');
      try {
        pendingRouteImage = await compressImage(file, 1000, 0.78);
        const preview = document.getElementById('crCoverPreview');
        preview.src = pendingRouteImage;
        preview.classList.add('visible');
        document.getElementById('routeFileLabel').textContent = '✓ Foto seleccionada — toca para cambiar';
        showError(err, '');
      } catch {
        showError(err, 'No se pudo procesar la imagen.');
      }
    };

    document.getElementById('postImageFile').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        showError(document.getElementById('createPostError'), 'La imagen es demasiado grande (máx. 8 MB).');
        return;
      }
      try {
        pendingPostImage = await compressImage(file, 900, 0.75);
        document.getElementById('postFileLabel').textContent = '📷 Cambiar foto';
        renderPostPreview();
        showError(document.getElementById('createPostError'), '');
      } catch {
        showError(document.getElementById('createPostError'), 'No se pudo cargar la imagen.');
      }
    };

    ['postCaption', 'postRoute', 'postVehicle'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('input', renderPostPreview);
    });

    document.getElementById('createPostForm').onsubmit = (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const err = document.getElementById('createPostError');
      const caption = document.getElementById('postCaption').value.trim();
      if (!pendingPostImage) return showError(err, 'Elige una foto para publicar.');
      if (!caption) return showError(err, 'Escribe una descripción.');
      const posts = getFeedPosts();
      posts.unshift({
        id: 'post_' + Date.now(),
        authorEmail: currentUser.email,
        authorName: currentUser.name,
        imageUrl: pendingPostImage,
        caption,
        routeTitle: document.getElementById('postRoute').value.trim() || undefined,
        vehicleLabel: document.getElementById('postVehicle').value.trim() || undefined,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
      });
      saveFeedPosts(posts);
      closeCreatePostModal();
      showTab('explore');
      renderFeed();
      showToast('Publicación compartida', 'success');
    };

    document.querySelectorAll('[data-tab]').forEach((el) => {
      el.onclick = () => { showApp(); showTab(el.dataset.tab); };
    });

    document.getElementById('toggleShare').onclick = function () {
      if (!requireAuth({ type: 'share' })) return;
      const panel = document.getElementById('groupPanel');
      const on = panel.hasAttribute('hidden');
      if (on) { panel.removeAttribute('hidden'); this.textContent = 'Dejar de compartir'; showToast('Ubicación compartida'); }
      else { panel.setAttribute('hidden', ''); this.textContent = 'Compartir ubicación (grupo)'; }
    };

    document.getElementById('driveNavBtn').onclick = () => {
      const route = getActiveDriveRoute();
      const path = getRoutePath(route);
      const dest = path[path.length - 1];
      openNavigation(dest[0], dest[1], route.title, 'waze');
    };


    document.getElementById('closeAvatarPicker').onclick = () => document.getElementById('avatarPickerModal').classList.remove('open');
    document.getElementById('avatarUploadBtn').onclick = () => document.getElementById('avatarFileInput').click();
    document.getElementById('avatarRemoveBtn').onclick = () => {
      if (!currentUser) return;
      currentUser.avatarUrl = null;
      syncCurrentUserToStorage();
      closeModals();
      renderProfile();
      updateHeaderBadge();
      showToast('Foto eliminada');
    };

    migrateLegacyStorage();
    migrateCustomRoutesToMeetups();
    purgeResolvedClubRequests();
    (async function bootstrap() {
      await restoreSession();
      showApp();
      showTab('explore');
      renderProfile();
      hideSplash();
      if (window.StradaCloud?.isConfigured() && !window.StradaCloud.isActive()) {
        console.info('[Strada] Supabase configurado. Inicia sesión para sincronizar datos.');
      }
    })();