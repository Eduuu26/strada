import type { Community, Membership } from '../../types';
import { tryGetSupabase } from './client';

// ---------------------------------------------------------------------------
// Acceso a datos de comunidades de pago (tablas communities / memberships).
// Devuelve [] / null en modo local (sin Supabase configurado). La RLS del
// Hito 1.0 ya filtra qué ve cada usuario; aquí solo modelamos las llamadas.
// ---------------------------------------------------------------------------

type CommunityRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  price_cents: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  stripe_account_id: string | null;
  created_at: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  status: string;
  stripe_subscription_id: string | null;
  joined_at: string;
};

export function communityFromRow(row: CommunityRow): Community {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    visibility: row.visibility as Community['visibility'],
    priceCents: row.price_cents,
    currency: row.currency,
    stripeProductId: row.stripe_product_id,
    stripePriceId: row.stripe_price_id,
    stripeAccountId: row.stripe_account_id,
    createdAt: row.created_at,
  };
}

export function membershipFromRow(row: MembershipRow): Membership {
  return {
    id: row.id,
    userId: row.user_id,
    communityId: row.community_id,
    role: row.role as Membership['role'],
    status: row.status as Membership['status'],
    stripeSubscriptionId: row.stripe_subscription_id,
    joinedAt: row.joined_at,
  };
}

/** Comunidades visibles para el usuario actual (RLS aplica el filtrado). */
export async function fetchCommunities(): Promise<Community[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('communities')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as CommunityRow[]).map(communityFromRow);
}

export async function fetchCommunityBySlug(slug: string): Promise<Community | null> {
  const sb = tryGetSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('communities').select('*').eq('slug', slug).maybeSingle();
  if (error || !data) return null;
  return communityFromRow(data as CommunityRow);
}

/** Membresías del usuario actual. */
export async function fetchMyMemberships(userId: string): Promise<Membership[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('memberships').select('*').eq('user_id', userId);
  if (error || !data) return [];
  return (data as MembershipRow[]).map(membershipFromRow);
}

/** Membresías de una comunidad (solo gestores por RLS). */
export async function fetchCommunityMembers(communityId: string): Promise<Membership[]> {
  const sb = tryGetSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('memberships')
    .select('*')
    .eq('community_id', communityId);
  if (error || !data) return [];
  return (data as MembershipRow[]).map(membershipFromRow);
}

/**
 * Crea una comunidad. La membresía del owner ('owner','active') la crea el
 * trigger handle_new_community en el servidor (el cliente no puede por RLS).
 */
export async function createCommunity(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    description: string | null;
    visibility: Community['visibility'];
    priceCents: number;
    currency: string;
  },
): Promise<{ ok: true; community: Community } | { ok: false; error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Supabase no está configurado.' };
  const { data, error } = await sb
    .from('communities')
    .insert({
      owner_id: ownerId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      visibility: input.visibility,
      price_cents: input.priceCents,
      currency: input.currency,
    })
    .select('*')
    .single();
  if (error || !data) {
    const isSlug = error?.code === '23505';
    return { ok: false, error: isSlug ? 'Ya existe una comunidad con ese identificador.' : 'No se pudo crear la comunidad.' };
  }
  return { ok: true, community: communityFromRow(data as CommunityRow) };
}

/**
 * El usuario se une como ('member','inactive'). Si la comunidad es gratuita,
 * el trigger handle_new_membership la activa; si es de pago, queda pendiente
 * hasta que Stripe la active vía webhook (Hito 1.5).
 */
export async function joinCommunity(
  userId: string,
  communityId: string,
): Promise<{ ok: true; membership: Membership } | { ok: false; error: string }> {
  const sb = tryGetSupabase();
  if (!sb) return { ok: false, error: 'Supabase no está configurado.' };
  const { data, error } = await sb
    .from('memberships')
    .insert({ user_id: userId, community_id: communityId, role: 'member', status: 'inactive' })
    .select('*')
    .single();
  if (error || !data) {
    const dup = error?.code === '23505';
    return { ok: false, error: dup ? 'Ya eres miembro de esta comunidad.' : 'No se pudo completar la inscripción.' };
  }
  return { ok: true, membership: membershipFromRow(data as MembershipRow) };
}

export async function leaveCommunity(userId: string, communityId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('memberships')
    .delete()
    .eq('user_id', userId)
    .eq('community_id', communityId);
  return !error;
}

export async function deleteCommunity(communityId: string): Promise<boolean> {
  const sb = tryGetSupabase();
  if (!sb) return false;
  const { error } = await sb.from('communities').delete().eq('id', communityId);
  return !error;
}
