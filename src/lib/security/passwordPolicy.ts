import { readAppStorage, writeAppStorage } from '../persistentStorage';

/** Política de contraseñas (alineada con buenas prácticas OWASP). */
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.';

export function isStrongPassword(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export function assertStrongPassword(password: string): void {
  if (!isStrongPassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }
}

/** Limita intentos de login en cliente (mitigación básica sin backend). */
export const LOGIN_ATTEMPTS_KEY = 'strada_login_attempts_v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRecord = { count: number; lockedUntil?: number };

function readAttempts(): AttemptRecord {
  try {
    const raw = readAppStorage(LOGIN_ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord) : { count: 0 };
  } catch {
    return { count: 0 };
  }
}

function writeAttempts(record: AttemptRecord) {
  void writeAppStorage(LOGIN_ATTEMPTS_KEY, JSON.stringify(record));
}

export function assertLoginAllowed(): void {
  const record = readAttempts();
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    throw new Error(`Demasiados intentos fallidos. Espera ${mins} minuto(s) e inténtalo de nuevo.`);
  }
}

export function recordFailedLogin(): void {
  const record = readAttempts();
  const count = record.count + 1;
  if (count >= MAX_ATTEMPTS) {
    writeAttempts({ count: 0, lockedUntil: Date.now() + LOCKOUT_MS });
  } else {
    writeAttempts({ count });
  }
}

export function clearLoginAttempts(): void {
  writeAttempts({ count: 0 });
}
