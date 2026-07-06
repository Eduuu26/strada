import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isAdminEmail,
  sanitizeEmailSubject,
  securityConfigOk,
  validateClubRequestPayload,
  verifyBearerToken,
} from './security.mjs';
import { mountV1Routes } from './v1.mjs';
import { ensureDemoAuthAccount } from './auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = Number(process.env.PORT || 8788);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'administracion@strada.com').trim().toLowerCase();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://127.0.0.1:8787,http://localhost:8787,http://127.0.0.1:8082,http://localhost:8082,http://127.0.0.1:8084,http://localhost:8084')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const configCheck = securityConfigOk();
if (!configCheck.ok) {
  console.error('❌ Faltan variables obligatorias en producción:', configCheck.missing.join(', '));
  if (IS_PRODUCTION) process.exit(1);
}

const VEHICLE_LABELS = {
  coche: 'Coches',
  moto: 'Motos',
  mixto: 'Coches y motos',
};

function vehicleLabel(mode) {
  return VEHICLE_LABELS[mode] || 'Coches y motos';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso || '';
  }
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const mailer = getTransporter();
  if (!mailer) {
    const err = new Error('SMTP no configurado.');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }
  await mailer.sendMail({
    from: `"Strada" <${process.env.SMTP_USER}>`,
    to,
    subject: sanitizeEmailSubject(subject),
    html,
    text,
  });
}

function buildClubRequestAdminEmail(request) {
  const name = escapeHtml(request.name);
  const description = escapeHtml(request.description);
  const requesterName = escapeHtml(request.requesterName);
  const requesterEmail = escapeHtml(request.requesterEmail);
  const location = escapeHtml(request.locationLabel || 'Sin ubicación');
  const vehicles = escapeHtml(vehicleLabel(request.vehicleMode));
  const when = escapeHtml(formatDate(request.createdAt));
  const subject = sanitizeEmailSubject(`[Strada] Nueva petición de club: ${request.name}`);
  const text = [
    'Nueva petición de creación de club en Strada',
    '',
    `Club: ${request.name}`,
    `Descripción: ${request.description}`,
    `Solicitante: ${request.requesterName} <${request.requesterEmail}>`,
    `ID: ${request.id}`,
  ].join('\n');
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#111">
      <h2>Nueva petición de club</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td>Club</td><td><strong>${name}</strong></td></tr>
        <tr><td>Descripción</td><td>${description}</td></tr>
        <tr><td>Vehículos</td><td>${vehicles}</td></tr>
        <tr><td>Zona</td><td>${location}</td></tr>
        <tr><td>Solicitante</td><td>${requesterName} &lt;${requesterEmail}&gt;</td></tr>
        <tr><td>Fecha</td><td>${when}</td></tr>
      </table>
    </div>`;
  return { subject, html, text };
}

function buildClubDecisionEmail(request, decision, clubId) {
  const approved = decision === 'approved';
  const name = escapeHtml(request.name);
  const subject = sanitizeEmailSubject(
    approved
      ? `[Strada] Tu club «${request.name}» ha sido aprobado`
      : `[Strada] Tu petición de club «${request.name}» ha sido rechazada`,
  );
  const text = approved
    ? `Tu petición para el club «${request.name}» ha sido aprobada.`
    : `Tu petición para el club «${request.name}» no ha sido aprobada.`;
  const html = approved
    ? `<p>Tu club <strong>«${name}»</strong> ha sido aprobado.</p>`
    : `<p>Tu petición para <strong>«${name}»</strong> no ha sido aprobada.</p>`;
  return { subject, html, text, clubId };
}

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        if (IS_PRODUCTION) return callback(new Error('CORS: origen requerido'));
        return callback(null, true);
      }
      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('CORS no permitido'));
    },
  }),
);

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones. Inténtalo más tarde.' },
});

async function requireAuth(req, res, next) {
  const result = await verifyBearerToken(req.get('authorization'));
  if (!result.ok) {
    return res.status(401).json({ ok: false, error: result.error });
  }
  req.stradaUser = result.user;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    smtpConfigured: smtpConfigured(),
  });
});

app.post('/api/email/club-request', emailLimiter, requireAuth, async (req, res) => {
  try {
    const request = req.body?.request;
    if (!validateClubRequestPayload(request)) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }
    if (req.stradaUser.email !== String(request.requesterEmail).trim().toLowerCase()) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }
    const mail = buildClubRequestAdminEmail(request);
    await sendMail({ to: ADMIN_EMAIL, ...mail });
    res.json({ ok: true });
  } catch (err) {
    console.error('[club-request]', err.message);
    res.status(err.code === 'SMTP_NOT_CONFIGURED' ? 503 : 500).json({
      ok: false,
      error: 'No se pudo enviar el correo',
    });
  }
});

app.post('/api/email/club-decision', emailLimiter, requireAuth, async (req, res) => {
  try {
    if (!isAdminEmail(req.stradaUser.email)) {
      return res.status(403).json({ ok: false, error: 'Solo administración puede enviar esta notificación' });
    }
    const { decision, request, clubId } = req.body || {};
    if (!validateClubRequestPayload(request) || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }
    const mail = buildClubDecisionEmail(request, decision, clubId);
    await sendMail({ to: String(request.requesterEmail).trim().toLowerCase(), ...mail });
    res.json({ ok: true });
  } catch (err) {
    console.error('[club-decision]', err.message);
    res.status(err.code === 'SMTP_NOT_CONFIGURED' ? 503 : 500).json({
      ok: false,
      error: 'No se pudo enviar el correo',
    });
  }
});

mountV1Routes(app, { requireAuth, emailLimiter, sendMail, ADMIN_EMAIL, escapeHtml });

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'No encontrado' });
});

app.listen(PORT, '0.0.0.0', () => {
  ensureDemoAuthAccount();
  console.log(`Strada email server → http://127.0.0.1:${PORT}`);
  if (!smtpConfigured()) {
    console.warn('⚠ SMTP no configurado. Crea server/.env desde server/.env.example');
  }
});
