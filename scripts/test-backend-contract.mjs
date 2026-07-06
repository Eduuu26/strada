/**
 * Contrato API v1 — validaciones del servidor y rutas esperadas.
 * node scripts/test-backend-contract.mjs
 */

import {
  validateReportPayload,
  validateSocialGraph,
  validateMatchLike,
  validateMatchSwipe,
  validatePushToken,
} from '../server/v1.mjs';
import {
  validateAuthRegister,
  validateAuthLogin,
  validatePasswordUpdate,
  registerAccount,
  authenticateAccount,
  verifyStradaAccessToken,
} from '../server/auth.mjs';
import { getSeedProfile } from '../server/seed-profiles.mjs';

const results = [];
const pass = (n, d = '') => {
  results.push({ n, ok: true, d });
  console.log(`✓ ${n}${d ? ` — ${d}` : ''}`);
};
const fail = (n, d = '') => {
  results.push({ n, ok: false, d });
  console.error(`✗ ${n}${d ? ` — ${d}` : ''}`);
};
const assert = (cond, name, detail = '') => {
  if (cond) pass(name, detail);
  else fail(name, detail);
};

const ROUTES = [
  'GET /api/v1/health',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/login',
  'GET /api/v1/auth/me',
  'POST /api/v1/auth/password',
  'DELETE /api/v1/auth/me',
  'GET /api/v1/auth/export',
  'GET /api/v1/profiles',
  'GET /api/v1/profiles/:email',
  'PUT /api/v1/profiles/me',
  'POST /api/v1/push-tokens',
  'GET /api/v1/social/graph',
  'PUT /api/v1/social/graph',
  'GET /api/v1/match/state',
  'POST /api/v1/match/likes',
  'POST /api/v1/match/swipes',
  'POST /api/v1/reports',
];

assert(ROUTES.length === 17, 'rutas v1 documentadas', `${ROUTES.length} endpoints`);

assert(
  validateReportPayload({ targetEmail: 'a@b.es', reason: 'spam' }),
  'reporte válido',
);
assert(
  !validateReportPayload({ targetEmail: 'bad', reason: 'spam' }),
  'reporte rechaza email inválido',
);
assert(
  !validateReportPayload({ targetEmail: 'a@b.es', reason: 'unknown' }),
  'reporte rechaza motivo desconocido',
);

assert(
  validateSocialGraph({ follows: [], friendRequests: [] }),
  'grafo social vacío válido',
);
assert(!validateSocialGraph({ follows: 'x' }), 'grafo social inválido');

assert(
  validateMatchLike({
    like: { id: '1', fromEmail: 'a@b.es', toEmail: 'c@d.es' },
  }),
  'like válido',
);
assert(!validateMatchLike({ like: { id: '1' } }), 'like incompleto rechazado');

assert(
  validateMatchSwipe({ cardId: 'x', decision: 'like' }),
  'swipe like válido',
);
assert(
  validateMatchSwipe({ cardId: 'x', decision: 'pass' }),
  'swipe pass válido',
);
assert(!validateMatchSwipe({ cardId: 'x', decision: 'maybe' }), 'swipe inválido');

assert(validatePushToken({ token: 'ExponentPushToken[abc]', platform: 'ios' }), 'push token válido');
assert(!validatePushToken({ token: '', platform: 'ios' }), 'push token vacío rechazado');
assert(!validatePushToken({ token: 'x', platform: 'windows' }), 'push plataforma inválida');

assert(validateAuthRegister({ name: 'Ana', email: 'a@b.es', password: 'StradaDemo1!' }), 'registro válido');
assert(!validateAuthRegister({ name: '', email: 'a@b.es', password: 'x' }), 'registro inválido');
assert(validateAuthLogin({ email: 'a@b.es', password: 'secret' }), 'login válido');
assert(validatePasswordUpdate({ newPassword: 'StradaDemo1!' }), 'cambio contraseña válido');

const regEmail = `test_auth_${Date.now()}@strada.es`;
const reg = registerAccount({ name: 'Test User', email: regEmail, password: 'StradaDemo1!' });
assert(reg.ok, 'registerAccount');
const login = authenticateAccount({ email: regEmail, password: 'StradaDemo1!' });
assert(login.ok && login.data.token, 'authenticateAccount emite JWT');
const verified = verifyStradaAccessToken(login.data.token);
assert(verified.ok && verified.user.email === regEmail, 'verifyStradaAccessToken');

const laura = getSeedProfile('laura@strada.es');
assert(laura?.name === 'Laura M.', 'seed laura@strada.es');
assert(getSeedProfile('unknown@x.es') === null, 'seed desconocido → null');

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} OK`);
process.exit(failed ? 1 : 0);
