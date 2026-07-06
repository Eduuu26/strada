import { assertCleanText, containsProfanity } from './profanity';

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;

export const DISPLAY_NAME_FORMAT_MESSAGE =
  `El nombre debe tener entre ${DISPLAY_NAME_MIN} y ${DISPLAY_NAME_MAX} caracteres (letras, números, espacios, punto o guión).`;

export const DISPLAY_NAME_TAKEN_MESSAGE = 'Ese nombre de usuario ya está en uso. Elige otro.';

const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .'-]*[\p{L}\p{N}.-]$/u;

export function normalizeDisplayNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateDisplayNameFormat(name: string): string | null {
  const trimmed = sanitizeDisplayName(name);
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
    return DISPLAY_NAME_FORMAT_MESSAGE;
  }
  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return DISPLAY_NAME_FORMAT_MESSAGE;
  }
  if (containsProfanity(trimmed)) {
    return 'El nombre contiene palabras no permitidas.';
  }
  return null;
}

export function isDisplayNameTaken(
  name: string,
  takenNames: Iterable<string>,
  excludeEmail?: string,
  emailsByName?: Map<string, string>,
): boolean {
  const key = normalizeDisplayNameKey(name);
  if (!key) return false;
  for (const existing of takenNames) {
    if (normalizeDisplayNameKey(existing) !== key) continue;
    if (excludeEmail && emailsByName) {
      const owner = emailsByName.get(existing);
      if (owner && owner.toLowerCase() === excludeEmail.toLowerCase()) continue;
    }
    return true;
  }
  return false;
}

export function assertDisplayNameAvailable(
  name: string,
  takenNames: Iterable<string>,
  excludeEmail?: string,
  emailsByName?: Map<string, string>,
): void {
  const formatError = validateDisplayNameFormat(name);
  if (formatError) throw new Error(formatError);
  assertCleanText(name, 'El nombre');
  if (isDisplayNameTaken(name, takenNames, excludeEmail, emailsByName)) {
    throw new Error(DISPLAY_NAME_TAKEN_MESSAGE);
  }
}
