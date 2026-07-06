import { readUserJson, writeUserJson, listUserJsonByPrefix } from './storage.mjs';
import { getSeedProfile, listSeedProfiles } from './seed-profiles.mjs';
import {
  authenticateAccount,
  registerAccount,
  getAccountByEmail,
  updateAccountPassword,
  deleteAccountData,
  exportAccountData,
  validateAuthRegister,
  validateAuthLogin,
  validatePasswordUpdate,
} from './auth.mjs';

const REPORT_REASONS = new Set([
  'spam',
  'harassment',
  'inappropriate_photo',
  'fake_profile',
  'other',
]);

export function validateReportPayload(body) {
  if (!body?.targetEmail || !body?.reason) return false;
  if (!REPORT_REASONS.has(body.reason)) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.targetEmail))) return false;
  if (String(body.details || '').length > 2000) return false;
  return true;
}

export function validateSocialGraph(body) {
  if (!body || !Array.isArray(body.follows) || !Array.isArray(body.friendRequests)) return false;
  return true;
}

export function validateMatchLike(body) {
  return Boolean(body?.like?.id && body?.like?.fromEmail && body?.like?.toEmail);
}

export function validateMatchSwipe(body) {
  return Boolean(body?.cardId && (body.decision === 'like' || body.decision === 'pass'));
}

const PUSH_PLATFORMS = new Set(['ios', 'android', 'web']);

export function validatePushToken(body) {
  return Boolean(body?.token?.trim() && PUSH_PLATFORMS.has(body.platform));
}

function listDiscoverableProfiles(excludeEmail, limit) {
  const exclude = String(excludeEmail || '').trim().toLowerCase();
  const map = new Map();
  for (const seed of listSeedProfiles()) {
    map.set(seed.email.toLowerCase(), { ...seed, email: seed.email.toLowerCase() });
  }
  for (const stored of listUserJsonByPrefix('profile')) {
    if (!stored?.email) continue;
    const key = String(stored.email).trim().toLowerCase();
    map.set(key, { ...stored, email: key });
  }
  return [...map.values()]
    .filter((p) => p.email !== exclude)
    .filter((p) => Array.isArray(p.vehicles) && p.vehicles.some((v) => v.photoUrl || v.brand))
    .slice(0, limit);
}

export function mountV1Routes(app, deps) {
  const { requireAuth, emailLimiter, sendMail, ADMIN_EMAIL, escapeHtml } = deps;

  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, version: 1, storage: 'file', auth: 'strada-jwt' });
  });

  app.post('/api/v1/auth/register', emailLimiter, (req, res) => {
    if (!validateAuthRegister(req.body)) {
      return res.status(400).json({ ok: false, error: 'Datos de registro inválidos' });
    }
    const result = registerAccount({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    if (!result.ok) return res.status(409).json(result);
    res.json({ ok: true, data: result.data });
  });

  app.post('/api/v1/auth/login', emailLimiter, (req, res) => {
    if (!validateAuthLogin(req.body)) {
      return res.status(400).json({ ok: false, error: 'Correo y contraseña requeridos' });
    }
    const result = authenticateAccount({
      email: req.body.email,
      password: req.body.password,
    });
    if (!result.ok) return res.status(401).json(result);
    res.json({ ok: true, data: result.data });
  });

  app.get('/api/v1/auth/me', requireAuth, (req, res) => {
    const user = getAccountByEmail(req.stradaUser.email);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Cuenta no encontrada' });
    }
    res.json({ ok: true, data: user });
  });

  app.post('/api/v1/auth/password', requireAuth, (req, res) => {
    if (!validatePasswordUpdate(req.body)) {
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const result = updateAccountPassword(req.stradaUser.email, req.body.newPassword);
    if (!result.ok) return res.status(400).json(result);
    res.json({ ok: true });
  });

  app.delete('/api/v1/auth/me', requireAuth, (req, res) => {
    deleteAccountData(req.stradaUser.email);
    res.json({ ok: true });
  });

  app.get('/api/v1/auth/export', requireAuth, (req, res) => {
    const data = exportAccountData(req.stradaUser.email);
    if (!data) return res.status(404).json({ ok: false, error: 'Cuenta no encontrada' });
    res.json({ ok: true, data });
  });

  app.get('/api/v1/profiles', requireAuth, (req, res) => {
    const exclude = String(req.query.exclude || req.stradaUser.email).trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
    const profiles = listDiscoverableProfiles(exclude, limit);
    res.json({ ok: true, data: profiles });
  });

  app.get('/api/v1/profiles/:email', (req, res) => {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Email inválido' });
    }
    const stored = readUserJson('profile', email, null);
    const profile = stored?.email ? stored : getSeedProfile(email);
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Perfil no encontrado' });
    }
    res.json({ ok: true, data: { ...profile, email } });
  });

  app.put('/api/v1/profiles/me', requireAuth, (req, res) => {
    const body = req.body ?? {};
    if (!body.name?.trim()) {
      return res.status(400).json({ ok: false, error: 'Nombre requerido' });
    }
    const payload = {
      email: req.stradaUser.email,
      name: String(body.name).trim().slice(0, 80),
      avatarUrl: body.avatarUrl ? String(body.avatarUrl).slice(0, 500) : undefined,
      vehicles: Array.isArray(body.vehicles) ? body.vehicles.slice(0, 20) : [],
      socials: body.socials ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    writeUserJson('profile', req.stradaUser.email, payload);
    res.json({ ok: true, data: payload });
  });

  app.post('/api/v1/push-tokens', requireAuth, (req, res) => {
    if (!validatePushToken(req.body)) {
      return res.status(400).json({ ok: false, error: 'Token inválido' });
    }
    const email = req.stradaUser.email;
    const state = readUserJson('push', email, { tokens: [], updatedAt: '' });
    const token = String(req.body.token).trim().slice(0, 200);
    const platform = req.body.platform;
    const existing = state.tokens ?? [];
    const next = existing.filter((t) => t.token !== token);
    next.unshift({ token, platform, updatedAt: new Date().toISOString() });
    writeUserJson('push', email, {
      tokens: next.slice(0, 10),
      updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  app.get('/api/v1/social/graph', requireAuth, (req, res) => {
    const graph = readUserJson('social', req.stradaUser.email, {
      follows: [],
      friendRequests: [],
      updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true, data: graph });
  });

  app.put('/api/v1/social/graph', requireAuth, (req, res) => {
    if (!validateSocialGraph(req.body)) {
      return res.status(400).json({ ok: false, error: 'Grafo social inválido' });
    }
    const payload = {
      follows: req.body.follows,
      friendRequests: req.body.friendRequests,
      updatedAt: new Date().toISOString(),
    };
    writeUserJson('social', req.stradaUser.email, payload);
    res.json({ ok: true, data: payload });
  });

  app.get('/api/v1/match/state', requireAuth, (req, res) => {
    const email = req.stradaUser.email;
    const own = readUserJson('match', email, { likes: [], swipes: {}, updatedAt: '' });
    const inbox = readUserJson('match_inbox', email, { likes: [] });
    const likeMap = new Map();
    for (const like of [...(inbox.likes ?? []), ...(own.likes ?? [])]) {
      likeMap.set(like.id, like);
    }
    const state = {
      likes: [...likeMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      swipes: own.swipes ?? {},
      updatedAt: new Date().toISOString(),
    };
    res.json({ ok: true, data: state });
  });

  app.post('/api/v1/match/likes', requireAuth, (req, res) => {
    if (!validateMatchLike(req.body)) {
      return res.status(400).json({ ok: false, error: 'Like inválido' });
    }
    const like = req.body.like;
    if (like.fromEmail.toLowerCase() !== req.stradaUser.email) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }
    const state = readUserJson('match', req.stradaUser.email, { likes: [], swipes: {}, updatedAt: '' });
    if (!state.likes.some((l) => l.id === like.id)) {
      state.likes.unshift(like);
      state.likes = state.likes.slice(0, 200);
    }
    const targetState = readUserJson('match_inbox', like.toEmail, { likes: [], swipes: {}, updatedAt: '' });
    if (!targetState.likes.some((l) => l.id === like.id)) {
      targetState.likes.unshift(like);
      targetState.likes = targetState.likes.slice(0, 200);
      writeUserJson('match_inbox', like.toEmail, { ...targetState, updatedAt: new Date().toISOString() });
    }
    state.updatedAt = new Date().toISOString();
    writeUserJson('match', req.stradaUser.email, state);
    res.json({ ok: true });
  });

  app.post('/api/v1/match/swipes', requireAuth, (req, res) => {
    if (!validateMatchSwipe(req.body)) {
      return res.status(400).json({ ok: false, error: 'Swipe inválido' });
    }
    const state = readUserJson('match', req.stradaUser.email, { likes: [], swipes: {}, updatedAt: '' });
    state.swipes[req.body.cardId] = req.body.decision;
    state.updatedAt = new Date().toISOString();
    writeUserJson('match', req.stradaUser.email, state);
    res.json({ ok: true });
  });

  app.post('/api/v1/reports', emailLimiter, requireAuth, async (req, res) => {
    try {
      if (!validateReportPayload(req.body)) {
        return res.status(400).json({ ok: false, error: 'Reporte inválido' });
      }
      const reporter = escapeHtml(req.stradaUser.email);
      const target = escapeHtml(req.body.targetEmail);
      const reason = escapeHtml(req.body.reason);
      const details = escapeHtml(req.body.details || '');
      const subject = `[Strada] Reporte de contenido: ${req.body.reason}`;
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2>Reporte de contenido</h2>
          <p><strong>Reportado por:</strong> ${reporter}</p>
          <p><strong>Usuario reportado:</strong> ${target}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p><strong>Detalles:</strong> ${details || '—'}</p>
        </div>`;
      await sendMail({ to: ADMIN_EMAIL, subject, html, text: `${reporter} reportó a ${target}: ${reason}` });
      res.json({ ok: true, data: { received: true } });
    } catch (err) {
      console.error('[reports]', err.message);
      res.status(500).json({ ok: false, error: 'No se pudo enviar el reporte' });
    }
  });
}
