import { useCallback, useEffect, useState } from 'react';

import {
  createCommunityRoute as createRouteRepo,
  deleteCommunityRoute as deleteRouteRepo,
  fetchCommunityRoutes,
  updateRouteStatus,
} from '../lib/supabase/communityRoutesRepository';
import { lineDistanceMeters } from '../lib/routeGeo';
import type { CommunityRoute, CreateCommunityRouteInput, RouteStatus } from '../types';

type Result = { ok: true; routeId: string } | { ok: false; error: string };

/**
 * Carga y gestiona las rutas de una comunidad. Sirve tanto al visor móvil
 * como (vía el mismo contrato) al panel de creación. En modo local (sin
 * Supabase) devuelve una lista vacía sin romper la UI.
 */
export function useCommunityRoutes(communityId: string | undefined) {
  const [routes, setRoutes] = useState<CommunityRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!communityId) {
      setRoutes([]);
      return;
    }
    setLoading(true);
    try {
      setRoutes(await fetchCommunityRoutes(communityId));
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createRoute = useCallback(
    async (input: CreateCommunityRouteInput): Promise<Result> => {
      // Calcula la distancia desde la geometría si no viene dada.
      const withDistance: CreateCommunityRouteInput = {
        ...input,
        distanceM: input.distanceM ?? lineDistanceMeters(input.geom),
      };
      const res = await createRouteRepo(withDistance);
      if (res.ok) await refresh();
      return res;
    },
    [refresh],
  );

  const setStatus = useCallback(
    async (routeId: string, status: RouteStatus) => {
      const ok = await updateRouteStatus(routeId, status);
      if (ok) await refresh();
      return ok;
    },
    [refresh],
  );

  const publishRoute = useCallback((routeId: string) => setStatus(routeId, 'published'), [setStatus]);
  const archiveRoute = useCallback((routeId: string) => setStatus(routeId, 'archived'), [setStatus]);

  const deleteRoute = useCallback(
    async (routeId: string) => {
      const ok = await deleteRouteRepo(routeId);
      if (ok) await refresh();
      return ok;
    },
    [refresh],
  );

  return { routes, loading, refresh, createRoute, publishRoute, archiveRoute, deleteRoute };
}
