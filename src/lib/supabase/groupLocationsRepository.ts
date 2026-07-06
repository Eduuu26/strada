import type { RealtimeChannel } from '@supabase/supabase-js';
import { tryGetSupabase } from './client';

export type GroupLocation = {
  routeId: string;
  userEmail: string;
  userName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

type Row = {
  route_id: string;
  user_email: string;
  user_name: string;
  latitude: number;
  longitude: number;
  updated_at: string;
};

function fromRow(row: Row): GroupLocation {
  return {
    routeId: row.route_id,
    userEmail: row.user_email,
    userName: row.user_name,
    latitude: row.latitude,
    longitude: row.longitude,
    updatedAt: row.updated_at,
  };
}

export async function fetchGroupLocations(routeId: string): Promise<GroupLocation[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('group_locations')
    .select('*')
    .eq('route_id', routeId)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function upsertGroupLocation(
  loc: Omit<GroupLocation, 'updatedAt'>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Supabase no configurado' };
  const { error } = await sb.from('group_locations').upsert(
    {
      route_id: loc.routeId,
      user_email: loc.userEmail.toLowerCase(),
      user_name: loc.userName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'route_id,user_email' },
  );
  if (!error) return { ok: true };
  if (error.code === 'PGRST205' || error.message?.includes('group_locations')) {
    return { ok: false, error: 'Tabla group_locations no encontrada. Aplica la migración en Supabase.' };
  }
  return { ok: false, error: error.message };
}

export async function removeGroupLocation(routeId: string, userEmail: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('group_locations')
    .delete()
    .eq('route_id', routeId)
    .eq('user_email', userEmail.toLowerCase());
  return !error;
}

export function subscribeToGroupLocations(
  routeId: string,
  onChange: (locations: GroupLocation[]) => void,
): () => void {
  const sb = tryGetSupabase();
  if (!sb) return () => {};

  let channel: RealtimeChannel;

  const refresh = () => {
    void fetchGroupLocations(routeId).then(onChange);
  };

  channel = sb
    .channel(`group-loc-${routeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_locations', filter: `route_id=eq.${routeId}` },
      () => refresh(),
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        void refresh();
      }
    });

  void refresh();

  return () => {
    void sb.removeChannel(channel);
  };
}
