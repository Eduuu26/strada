import crypto from 'crypto';
import { readUserJson, writeUserJson, deleteUserJson } from './storage.mjs';

const JWT_SECRET = process.env.STRADA_JWT_SECRET?.trim() || 'strada-dev-secret-change-in-production';
const TOKEN_TTL_SEC = Number(process.env.STRADA_JWT_TTL_SEC || 60 * 60 * 24 * 7);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signAccessToken(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  };
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return { token: `${header}.${body}.${sig}`, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export function verifyStradaAccessToken(token) {
  if (!token?.includes('.')) return { ok: false, error: 'Token inválido' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, error: 'Token inválido' };
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (sig !== expected) return { ok: false, error: 'Token inválido' };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, error: 'Token inválido' };
  }
  if (!payload?.email || !payload?.sub) return { ok: false, error: 'Token inválido' };
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'Sesión expirada' };
  }
  return {
    ok: true,
    user: {
      id: String(payload.sub),
      email: String(payload.email).trim().toLowerCase(),
      name: String(payload.name || payload.email),
    },
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
}

function readAuthAccount(email) {
  return readUserJson('auth', email, null);
}

function writeAuthAccount(email, data) {
  writeUserJson('auth', email, data);
}

export function authConfigOk() {
  if (!IS_PRODUCTION) return { ok: true };
  if (!process.env.STRADA_JWT_SECRET?.trim()) {
    return { ok: false, missing: ['STRADA_JWT_SECRET'] };
  }
  return { ok: true };
}

export function validateAuthRegister(body) {
  if (!body?.name?.trim() || !body?.email || !body?.password) return false;
  if (String(body.name).length > 80) return false;
  if (String(body.password).length < 8) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) return false;
  return true;
}

export function validateAuthLogin(body) {
  return Boolean(body?.email && body?.password && String(body.password).length >= 1);
}

export function validatePasswordUpdate(body) {
  return Boolean(body?.newPassword && String(body.newPassword).length >= 8);
}

function buildUserResponse(auth, profile) {
  return {
    id: auth.id,
    email: auth.email,
    name: profile?.name ?? auth.name,
    avatarUrl: profile?.avatarUrl,
    vehicles: profile?.vehicles ?? [],
    socials: profile?.socials,
    vehicleType: profile?.vehicleType,
    fuelPref: profile?.fuelPref,
    createdAt: auth.createdAt,
  };
}

export function registerAccount({ name, email, password }) {
  const key = String(email).trim().toLowerCase();
  if (readAuthAccount(key)) {
    return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
  }
  const { salt, hash } = hashPassword(password);
  const auth = {
    id: `usr_${crypto.randomUUID()}`,
    email: key,
    name: String(name).trim().slice(0, 80),
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  writeAuthAccount(key, auth);
  const profile = {
    email: key,
    name: auth.name,
    vehicles: [],
    socials: { instagram: '', tiktok: '', x: '', youtube: '' },
    updatedAt: new Date().toISOString(),
  };
  writeUserJson('profile', key, profile);
  const session = signAccessToken(auth);
  return { ok: true, data: { user: buildUserResponse(auth, profile), ...session } };
}

export function authenticateAccount({ email, password }) {
  const key = String(email).trim().toLowerCase();
  const auth = readAuthAccount(key);
  if (!auth?.passwordHash || !auth?.passwordSalt) {
    return { ok: false, error: 'Correo o contraseña incorrectos.' };
  }
  if (!verifyPassword(password, auth.passwordSalt, auth.passwordHash)) {
    return { ok: false, error: 'Correo o contraseña incorrectos.' };
  }
  const profile = readUserJson('profile', key, null);
  const session = signAccessToken(auth);
  return { ok: true, data: { user: buildUserResponse(auth, profile), ...session } };
}

export function getAccountByEmail(email) {
  const key = String(email).trim().toLowerCase();
  const auth = readAuthAccount(key);
  if (!auth) return null;
  const profile = readUserJson('profile', key, null);
  return buildUserResponse(auth, profile);
}

export function updateAccountPassword(email, newPassword) {
  const key = String(email).trim().toLowerCase();
  const auth = readAuthAccount(key);
  if (!auth) return { ok: false, error: 'Cuenta no encontrada.' };
  const { salt, hash } = hashPassword(newPassword);
  writeAuthAccount(key, { ...auth, passwordHash: hash, passwordSalt: salt, updatedAt: new Date().toISOString() });
  return { ok: true };
}

export function deleteAccountData(email) {
  const key = String(email).trim().toLowerCase();
  for (const prefix of ['auth', 'profile', 'social', 'match', 'match_inbox', 'push']) {
    deleteUserJson(prefix, key);
  }
  return { ok: true };
}

export function exportAccountData(email) {
  const user = getAccountByEmail(email);
  if (!user) return null;
  const key = String(email).trim().toLowerCase();
  return {
    exportedAt: new Date().toISOString(),
    format: 'strada-export-v1',
    profile: user,
    social: readUserJson('social', key, null),
    match: readUserJson('match', key, null),
    push: readUserJson('push', key, null),
  };
}

export function ensureDemoAuthAccount() {
  const email = 'carlos@strada.es';
  if (readAuthAccount(email)) return;
  registerAccount({ name: 'Carlos R.', email, password: 'StradaDemo1!' });
}
