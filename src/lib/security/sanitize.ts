/** Sanitización compartida (web + documentación). */

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Solo permite URLs http(s) o data:image para avatares locales. */
export function sanitizeImageUrl(url: unknown): string {
  const value = String(url ?? '').trim();
  if (!value) return '';
  if (value.startsWith('data:image/')) return value.replace(/[\s"']/g, '');
  if (/^https?:\/\//i.test(value)) return value.replace(/[\s"']/g, '');
  return '';
}

/** Evita inyección en asuntos de email. */
export function sanitizeEmailSubject(value: unknown): string {
  return String(value ?? '')
    .replace(/[\r\n]/g, ' ')
    .slice(0, 200);
}

/** Mensajes de error genéricos (no filtrar información interna). */
export function authErrorMessage(cause: unknown): string {
  if (cause instanceof Error) {
    const msg = cause.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('over_email_send')) {
      return 'Demasiados envíos de correo en poco tiempo (límite de Supabase). Espera unos minutos o desactiva "Confirm email" en Supabase.';
    }
    if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
      return 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada (y la carpeta de spam).';
    }
    if (
      msg.includes('email_address_invalid') ||
      (msg.includes('email') && msg.includes('invalid'))
    ) {
      return 'Ese correo no es válido o no se puede entregar. Usa una dirección real (por ejemplo, Gmail).';
    }
    if (msg.includes('invalid login') || msg.includes('incorrect')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if (msg.includes('password')) {
      return 'La contraseña no cumple los requisitos de seguridad.';
    }
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
