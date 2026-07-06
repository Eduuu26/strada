import type {
  CommunityRoute,
  CreateCommunityRouteInput,
  GeoLineString,
  GeoPoint,
  RouteStatus,
  RouteStop,
} from '../../types';
import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Acceso a community_routes / route_stops a través de las RPC que traducen
// GeoJSON ↔ PostGIS (migración 20250626180000). En modo local devuelve [].
// ---------------------------------------------------------------------------

type RouteRpcRow = {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  geom: GeoLineString;
  distance_m: number | null;
  duration_s: number | null;
  difficulty: string | null;
  road_type: string | null;
  scheduled_at: string | null;
  status: string;
  created_at: string;
  stops: RouteStop[] | null;
};

function routeFromRpc(row: RouteRpcRow): CommunityRoute {
  return {
    id: row.id,
    communityId: row.community_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    geom: row.geom,
    distanceM: row.distance_m,
    durationS: row.duration_s,
    difficulty: (row.difficulty as CommunityRoute['difficulty']) ?? null,
    roadType: row.road_type,
    scheduledAt: row.scheduled_at,
    status: row.status as RouteStatus,
    createdAt: row.created_at,
    stops: (row.stops ?? []).map((s) => ({
      ...s,
      geom: s.geom as GeoPoint,
    })),
  };
}

export async function fetchCommunityRoutes(communityId: string): Promise<CommunityRoute[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('get_community_routes', { p_community_id: communityId });
  if (error || !data) return [];
  return (data as RouteRpcRow[]).map(routeFromRpc);
}

export async function createCommunityRoute(
  input: CreateCommunityRouteInput,
): Promise<{ ok: true; routeId: string } | { ok: false; error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Supabase no está configurado.' };
  const { data, error } = await sb.rpc('create_community_route', {
    p_community_id: input.communityId,
    p_title: input.title,
    p_geojson: input.geom,
    p_description: input.description ?? null,
    p_distance_m: input.distanceM ?? null,
    p_duration_s: input.durationS ?? null,
    p_difficulty: input.difficulty ?? null,
    p_road_type: input.roadType ?? null,
    p_scheduled_at: input.scheduledAt ?? null,
    p_status: input.status ?? 'draft',
    p_stops: input.stops ?? [],
  });
  if (error || !data) {
    return { ok: false, error: 'No se pudo crear la ruta (¿permisos de gestor?).' };
  }
  return { ok: true, routeId: data as string };
}

export async function updateRouteStatus(routeId: string, status: RouteStatus): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('community_routes').update({ status }).eq('id', routeId);
  return !error;
}

export async function deleteCommunityRoute(routeId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('community_routes').delete().eq('id', routeId);
  return !error;
}
