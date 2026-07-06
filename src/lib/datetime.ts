/**
 * Convierte una fecha/hora escrita por el usuario (p. ej. "2026-07-20T09:00"
 * o "2026-07-20 09:00") en una cadena ISO válida. Devuelve null si no es una
 * fecha válida, para poder mostrar un error en lugar de lanzar una excepción
 * (new Date('').toISOString() lanza RangeError).
 */
export function parseUserDateToISO(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  // Permitimos espacio en lugar de 'T' para mayor comodidad.
  const normalized = value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Formato `YYYY-MM-DDTHH:mm` para inputs datetime-local y pickers. */
export function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
