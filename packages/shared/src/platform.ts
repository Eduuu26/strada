/**
 * Contratos de la plataforma de comunidades de pago (Fase 1).
 *
 * Estos tipos reflejan 1:1 las tablas creadas en la migración
 * 20250626150000_phase1_paid_platform.sql. Son el contrato compartido
 * entre la app móvil (Expo), el panel admin (Next.js) y las Edge Functions.
 *
 * Convención: la geometría viaja como GeoJSON en la capa de aplicación;
 * PostGIS la almacena como GEOGRAPHY(4326).
 */

// ---------- Geometría (GeoJSON, SRID 4326) ----------

/** [longitud, latitud] — orden GeoJSON (¡no lat,lng!). */
export type LngLat = [number, number];

export type GeoPoint = {
  type: 'Point';
  coordinates: LngLat;
};

export type GeoLineString = {
  type: 'LineString';
  coordinates: LngLat[];
};

// ---------- Enums / uniones ----------

export type Visibility = 'public' | 'private';
export type MembershipRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'active' | 'inactive' | 'past_due' | 'canceled';
export type RouteDifficulty = 'facil' | 'media' | 'dificil';
export type RouteStatus = 'draft' | 'published' | 'archived';
export type StopType =
  | 'inicio'
  | 'parada'
  | 'repostaje'
  | 'comida'
  | 'fin'
  | 'interes';
export type LiveSessionStatus = 'active' | 'ended';
export type LiveMessageKind = 'texto' | 'voz' | 'alerta';

// ---------- Entidades ----------

export type Community = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: Visibility;
  /** Precio de suscripción mensual en céntimos. */
  priceCents: number;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  /** Cuenta conectada (Express) del owner. */
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

export type CommunityRoute = {
  id: string;
  communityId: string;
  createdBy: string;
  title: string;
  description: string | null;
  /** Trazado del recorrido. */
  geom: GeoLineString;
  distanceM: number | null;
  durationS: number | null;
  difficulty: RouteDifficulty | null;
  roadType: string | null;
  scheduledAt: string | null;
  status: RouteStatus;
  createdAt: string;
};

export type RouteStop = {
  id: string;
  routeId: string;
  position: number;
  name: string;
  stopType: StopType | null;
  geom: GeoPoint;
  notes: string | null;
};

/** Precios por producto MITECO. Claves p.ej. "95E5", "98E5", "gasoleoA". */
export type FuelPrices = Record<string, number>;

export type FuelStation = {
  /** IDEESS de MITECO. */
  id: number;
  brand: string | null;
  address: string | null;
  municipality: string | null;
  province: string | null;
  geom: GeoPoint;
  prices: FuelPrices;
  updatedAt: string;
};

/** Resultado de la consulta "gasolineras cerca de una ruta por octanaje". */
export type FuelStationNearRoute = {
  id: number;
  brand: string | null;
  address: string | null;
  price: number;
  distanceM: number;
};

export type LiveSession = {
  id: string;
  routeId: string;
  startedBy: string;
  channel: string;
  status: LiveSessionStatus;
  startedAt: string;
  endedAt: string | null;
};

export type LiveMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  kind: LiveMessageKind;
  body: string | null;
  geom: GeoPoint | null;
  createdAt: string;
};

// ---------- DTOs de creación ----------

export type CreateCommunityInput = {
  name: string;
  slug: string;
  description?: string;
  visibility: Visibility;
  priceCents: number;
  currency?: string;
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
  stops: Array<Omit<RouteStop, 'id' | 'routeId'>>;
};
