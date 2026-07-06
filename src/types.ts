export type RouteDifficulty = 'facil' | 'media' | 'exigente';

export type RouteVehicleMode = 'mixto' | 'coches' | 'motos';

/** open = inscripción directa; request = solicitud aprobada por el creador */
export type JoinMode = 'open' | 'request';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type JoinRequest = {
  id: string;
  routeId?: string;
  meetupId?: string;
  userEmail: string;
  userName: string;
  vehicleType: VehicleType;
  vehicleLabel: string;
  status: JoinRequestStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type VehicleType = 'coche' | 'moto';

export type VehicleFormInput = {
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  photoUrl: string;
};

export type RouteStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  note?: string;
};

export type DrivingRoute = {
  id: string;
  title: string;
  region: string;
  province: string;
  description: string;
  coverImage?: string;
  distanceKm: number;
  durationMin: number;
  difficulty: RouteDifficulty;
  vehicleMode?: RouteVehicleMode;
  tags: string[];
  stops: RouteStop[];
  creatorEmail?: string;
  creatorName?: string;
  meetingAt?: string;
  meetingPoint?: string;
  meetingLat?: number;
  meetingLng?: number;
  navInstruction?: string;
  navNextKm?: number;
  maxAttendees?: number;
  joinMode?: JoinMode;
  isCustom?: boolean;
};

export type RouteSignup = {
  id: string;
  routeId?: string;
  meetupId?: string;
  userEmail: string;
  userName: string;
  vehicleType: VehicleType;
  vehicleLabel: string;
  joinedAt: string;
};

export type Meetup = {
  id: string;
  title: string;
  description: string;
  routeId?: string;
  meetingAt: string;
  meetingPoint: string;
  meetingLat?: number;
  meetingLng?: number;
  maxAttendees?: number;
  vehicleMode?: RouteVehicleMode;
  coverImage?: string;
  creatorEmail?: string;
  creatorName?: string;
  createdAt: string;
  joinMode?: JoinMode;
  isSeed?: boolean;
};

export type CreateMeetupInput = {
  title: string;
  description: string;
  routeId?: string;
  meetingAt: string;
  meetingPoint: string;
  maxAttendees: number;
  vehicleMode: RouteVehicleMode;
  coverImage?: string;
  joinMode: JoinMode;
};

export type UserVehicle = {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  year?: number;
  label: string;
  isDefault?: boolean;
  photoUrl?: string;
};

export type UserSocials = {
  instagram: string;
  tiktok: string;
  x: string;
  youtube: string;
};

export type ChatMessage = {
  id: string;
  type: 'user' | 'system';
  text: string;
  authorEmail?: string;
  authorName?: string;
  createdAt: string;
};

export type RouteChat = {
  id: string;
  meetupId?: string;
  routeId?: string;
  clubId?: string;
  title: string;
  organizerEmail?: string;
  participantEmails: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

/** Tipo de vehículo preferido a nivel de perfil (distinto del garaje). */
export type VehiclePreference = 'coche' | 'moto' | 'ambos';

/** Octanaje/combustible preferido para el filtrado de gasolineras. */
export type FuelPreference = '95' | '98' | 'diesel' | 'gnc';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
  socials?: UserSocials;
  vehicles: UserVehicle[];
  vehicleType?: VehiclePreference;
  fuelPref?: FuelPreference;
};

export type CreateRouteInput = {
  title: string;
  region: string;
  province: string;
  description: string;
  coverImage?: string;
  distanceKm: number;
  durationMin: number;
  difficulty: RouteDifficulty;
  vehicleMode: RouteVehicleMode;
  stopsText: string;
  meetingAt: string;
  meetingPoint: string;
  maxAttendees: number;
  joinMode: JoinMode;
};

export type FeedComment = {
  id: string;
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  authorEmail: string;
  authorName: string;
  imageUrl: string;
  caption: string;
  routeTitle?: string;
  vehicleLabel?: string;
  createdAt: string;
  likes: string[];
  comments: FeedComment[];
  isSeed?: boolean;
};

export type CreatePostInput = {
  imageUrl: string;
  caption: string;
  routeTitle?: string;
  vehicleLabel?: string;
};

/** Tarjeta del módulo Match (Tinder de coches). */
export type CarMatchCard = {
  id: string;
  ownerEmail: string;
  ownerName: string;
  ownerAvatarUrl?: string;
  vehicle: UserVehicle;
};

/** Like recibido en un vehículo del garaje. */
export type CarLikeNotification = {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  vehicleId: string;
  vehicleLabel: string;
  vehiclePhotoUrl?: string;
  createdAt: string;
  read: boolean;
};

export type CarSwipeDecision = 'like' | 'pass';

/** Seguimiento unidireccional entre perfiles. */
export type ProfileFollow = {
  followerEmail: string;
  followingEmail: string;
  createdAt: string;
};

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

/** Solicitud de amistad (conexión mutua al aceptar). */
export type FriendRequest = {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  status: FriendRequestStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type ProfileConnectionStatus =
  | 'self'
  | 'friend'
  | 'following'
  | 'follower'
  | 'mutual_follow'
  | 'request_sent'
  | 'request_received'
  | 'none';

export type ClubCreationRequestStatus = 'pending' | 'approved' | 'rejected';

export type ClubCreationRequest = {
  id: string;
  name: string;
  description: string;
  vehicleMode: RouteVehicleMode;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  requesterEmail: string;
  requesterName: string;
  status: ClubCreationRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedByEmail?: string;
  createdClubId?: string;
  approvalUnread?: boolean;
  reviewerEmail?: string;
};

export type ClubInvitationStatus = 'pending' | 'accepted' | 'rejected';

export type Club = {
  id: string;
  name: string;
  description: string;
  vehicleMode?: RouteVehicleMode;
  creatorEmail: string;
  creatorName: string;
  memberEmails: string[];
  createdAt: string;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
};

export type ClubInvitation = {
  id: string;
  clubId: string;
  clubName: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  status: ClubInvitationStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type CreateClubInput = {
  name: string;
  description: string;
  vehicleMode: RouteVehicleMode;
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
};

// ---------------------------------------------------------------------------
// Comunidades de pago (Fase 1 · Hito 1.2)
// Reflejan las tablas `communities` y `memberships` de la migración
// 20250626150000_phase1_paid_platform.sql. Equivalen a los contratos de
// @strada/shared, replicados aquí porque el app Expo aún no consume el paquete.
// ---------------------------------------------------------------------------

export type CommunityVisibility = 'public' | 'private';
export type MembershipRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'active' | 'inactive' | 'past_due' | 'canceled';

export type Community = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
  /** Precio de suscripción mensual en céntimos. */
  priceCents: number;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  stripeAccountId: string | null;
  createdAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  communityId: string;
  role: MembershipRole;
  status: MembershipStatus;
  stripeSubscriptionId: string | null;
  joinedAt: string;
};

export type CreateCommunityInput = {
  name: string;
  description?: string;
  visibility: CommunityVisibility;
  /** Precio mensual en céntimos (0 = gratis). */
  priceCents: number;
  currency?: string;
  slug?: string;
};

// ---------------------------------------------------------------------------
// Rutas de comunidad (Fase 1 · Hito 1.3)
// La geometría viaja como GeoJSON (SRID 4326) en la capa de aplicación;
// PostGIS la almacena como GEOGRAPHY. Reflejan community_routes / route_stops.
// ---------------------------------------------------------------------------

/** [longitud, latitud] — orden GeoJSON (¡no lat,lng!). */
export type LngLat = [number, number];

export type GeoPoint = { type: 'Point'; coordinates: LngLat };
export type GeoLineString = { type: 'LineString'; coordinates: LngLat[] };

export type RouteDifficulty = 'facil' | 'media' | 'dificil';
export type RouteStatus = 'draft' | 'published' | 'archived';
export type RouteStopType =
  | 'inicio'
  | 'parada'
  | 'repostaje'
  | 'comida'
  | 'fin'
  | 'interes';

export type RouteStop = {
  id: string;
  routeId: string;
  position: number;
  name: string;
  stopType: RouteStopType | null;
  geom: GeoPoint;
  notes: string | null;
};

export type CommunityRoute = {
  id: string;
  communityId: string;
  createdBy: string;
  title: string;
  description: string | null;
  geom: GeoLineString;
  distanceM: number | null;
  durationS: number | null;
  difficulty: RouteDifficulty | null;
  roadType: string | null;
  scheduledAt: string | null;
  status: RouteStatus;
  createdAt: string;
  stops?: RouteStop[];
};

export type CreateRouteStopInput = {
  position: number;
  name: string;
  stopType?: RouteStopType;
  geom: GeoPoint;
  notes?: string;
};

export type CreateCommunityRouteInput = {
  communityId: string;
  title: string;
  description?: string;
  geom: GeoLineString;
  distanceM?: number;
  durationS?: number;
  difficulty?: RouteDifficulty;
  roadType?: string;
  scheduledAt?: string;
  status?: RouteStatus;
  stops?: CreateRouteStopInput[];
};

// ---------------------------------------------------------------------------
// Gasolineras (Fase 1 · Hito 1.4)
// ---------------------------------------------------------------------------

/** Resultado de "gasolineras cerca de una ruta por octanaje". */
export type FuelStationNearRoute = {
  id: number;
  brand: string | null;
  address: string | null;
  municipality: string | null;
  province: string | null;
  /** Precio del combustible consultado (€). */
  price: number;
  /** Distancia al trazado en metros. */
  distanceM: number;
  geom: GeoPoint;
};
