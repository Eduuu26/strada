const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const INVALID_EMAIL_MESSAGE =
  'Introduce un correo válido con dominio completo (ej. tu@correo.com).';

/** Requiere usuario@dominio.tld (mín. 2 letras en la extensión). */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (!value || value.length > 254) return false;
  return EMAIL_PATTERN.test(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertValidEmail(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error(INVALID_EMAIL_MESSAGE);
  }
}
