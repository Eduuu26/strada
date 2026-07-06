import { normalizeEmail } from './email';

/**
 * Correos que reciben y revisan las peticiones de nuevos clubes.
 * Cualquiera que inicie sesión con uno de estos correos es administrador
 * de la plataforma.
 */
export const PLATFORM_ADMIN_EMAILS = [
  'administracion@strada.com',
  'admin1@strada.com',
  'admin2@strada.com',
] as const;

/** Lista normalizada de correos de administrador. */
export function getPlatformAdminEmails(): string[] {
  return PLATFORM_ADMIN_EMAILS.map((email) => normalizeEmail(email));
}

/** Admin principal (usado como revisor por defecto). */
export function getPlatformAdminEmail(): string {
  return normalizeEmail(PLATFORM_ADMIN_EMAILS[0]);
}

export function isPlatformAdmin(email: string): boolean {
  return getPlatformAdminEmails().includes(normalizeEmail(email));
}
