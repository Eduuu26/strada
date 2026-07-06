import type {
  Community,
  CreateCommunityInput,
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../types';

// ---------------------------------------------------------------------------
// Lógica pura de comunidades de pago. Sin dependencias de red ni de React,
// para poder reutilizarla y testearla. La fuente de verdad del *estado* de la
// suscripción es Stripe (Hito 1.5): el cliente solo crea membresías `inactive`.
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<MembershipRole, string> = {
  owner: 'Propietario',
  admin: 'Gestor',
  member: 'Miembro',
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  active: 'Activa',
  inactive: 'Pendiente de pago',
  past_due: 'Pago atrasado',
  canceled: 'Cancelada',
};

export function roleLabel(role: MembershipRole): string {
  return ROLE_LABELS[role];
}

export function membershipStatusLabel(status: MembershipStatus): string {
  return STATUS_LABELS[status];
}

/** Membresía de un usuario en una comunidad concreta (si existe). */
export function membershipFor(
  memberships: Membership[],
  userId: string,
  communityId: string,
): Membership | undefined {
  return memberships.find((m) => m.userId === userId && m.communityId === communityId);
}

/** Una membresía da acceso al contenido solo si está `active`. */
export function isActiveMembership(membership?: Membership): boolean {
  return membership?.status === 'active';
}

export function isActiveMember(
  memberships: Membership[],
  userId: string,
  communityId: string,
): boolean {
  return isActiveMembership(membershipFor(memberships, userId, communityId));
}

/** Owners y admins gestionan la comunidad (publican rutas, etc.). */
export function canManageCommunity(
  community: Community,
  membership?: Membership,
  userId?: string,
): boolean {
  if (userId && community.ownerId === userId) return true;
  if (!membership) return false;
  return membership.role === 'owner' || membership.role === 'admin';
}

/** Una comunidad es gratis si su precio es 0; entonces el alta es inmediata. */
export function isFreeCommunity(community: Pick<Community, 'priceCents'>): boolean {
  return community.priceCents <= 0;
}

/** Estado inicial de una nueva membresía al unirse (antes del pago). */
export function initialMembershipStatus(
  community: Pick<Community, 'priceCents'>,
): MembershipStatus {
  return isFreeCommunity(community) ? 'active' : 'inactive';
}

export function formatPrice(community: Pick<Community, 'priceCents' | 'currency'>): string {
  if (isFreeCommunity(community)) return 'Gratis';
  const amount = (community.priceCents / 100).toFixed(2);
  const currency = (community.currency || 'eur').toUpperCase();
  return `${amount} ${currency}/mes`;
}

/** Genera un slug URL-safe a partir del nombre. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export type ValidationResult =
  | { ok: true; value: Required<Pick<CreateCommunityInput, 'name' | 'slug' | 'visibility' | 'priceCents' | 'currency'>> & { description: string | null } }
  | { ok: false; error: string };

export function validateCreateCommunityInput(input: CreateCommunityInput): ValidationResult {
  const name = input.name?.trim() ?? '';
  if (name.length < 3) {
    return { ok: false, error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (name.length > 80) {
    return { ok: false, error: 'El nombre no puede superar los 80 caracteres.' };
  }
  if (!Number.isFinite(input.priceCents) || input.priceCents < 0) {
    return { ok: false, error: 'El precio no es válido.' };
  }
  const slug = (input.slug?.trim() || slugify(name)) || '';
  if (!slug) {
    return { ok: false, error: 'No se pudo generar un identificador (slug) válido.' };
  }
  return {
    ok: true,
    value: {
      name,
      slug,
      visibility: input.visibility,
      priceCents: Math.round(input.priceCents),
      currency: (input.currency || 'eur').toLowerCase(),
      description: input.description?.trim() ? input.description.trim() : null,
    },
  };
}
