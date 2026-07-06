# Lanzamiento Strada — con migración fuera de Supabase

Guía para publicar en App Store / Google Play **sin depender a largo plazo de Supabase**.

La app ya tiene una capa `src/lib/backend/` que enruta datos a:

| Modo | Variable | Uso |
|------|----------|-----|
| **Local** | `EXPO_PUBLIC_BACKEND_PROVIDER=local` | Solo AsyncStorage / seed (desarrollo) |
| **Supabase (transitorio)** | `supabase` + URL/anon key | Auth + tablas actuales |
| **Strada API** | `strada-api` + `EXPO_PUBLIC_STRADA_API_URL` | Backend propio en `server/` |

---

## Arquitectura de migración

```
┌─────────────┐     JWT (hoy Supabase)     ┌──────────────────┐
│  App Expo   │ ─────────────────────────► │  Strada API v1   │
│  (cliente)  │     social / match /       │  server/index    │
│             │     reports / profiles     │  + storage JSON  │
└─────────────┘                            └──────────────────┘
       │                                            │
       │  transitorio                               │  futuro
       ▼                                            ▼
┌─────────────┐                            ┌──────────────────┐
│  Supabase   │                            │  Postgres + S3   │
│  Auth + DB  │  ─── migrar y apagar ───►  │  auth propio     │
└─────────────┘                            └──────────────────┘
```

**Regla:** la app no debe importar Supabase fuera de `src/lib/supabase/` y rutas transitorias. Con `EXPO_PUBLIC_BACKEND_PROVIDER=strada-api` el login usa **StradaAuthProvider** (JWT propio). Supabase JWT sigue aceptado en el servidor hasta que lo desactives.

---

## Fase 0 — Desarrollo local (hoy)

```bash
cd rutas-app
npm install
npm run email-server          # puerto 8788 — email + API v1
```

En `.env`:

```env
EXPO_PUBLIC_BACKEND_PROVIDER=strada-api
EXPO_PUBLIC_STRADA_API_URL=http://127.0.0.1:8788
EXPO_PUBLIC_STRADA_EMAIL_API=http://127.0.0.1:8788

# Auth transitoria (opcional en local; demo sin Supabase usa cuenta local)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

App web:

```bash
npx expo start --web --port 8084
```

Cuenta demo: `carlos@strada.es` / `StradaDemo1!`

Pruebas automáticas:

```bash
npm run test:backend-contract
npm run test:content-policy
npm run test:social
npm run test:car-match
```

---

## Fase 1 — Beta con Supabase + API v1 en paralelo

1. Mantén Supabase para **auth** y datos que aún no estén en v1 (clubes, rutas, chat, Stripe).
2. Activa sync remoto para social, match y reportes:

```env
EXPO_PUBLIC_BACKEND_PROVIDER=strada-api
EXPO_PUBLIC_STRADA_API_URL=https://api.tu-dominio.com
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

3. Despliega `server/` en Railway/Render (misma guía que email en `DEPLOY.md`).
4. El servidor valida JWT de Supabase (`SUPABASE_URL` + `SUPABASE_ANON_KEY` en `server/.env`).

**No añadas nuevas migraciones SQL en Supabase** para funciones ya cubiertas por v1 (social, match, reportes, perfiles públicos).

---

## Fase 2 — Cortar dependencia de Supabase (por módulo)

| Módulo | Estado v1 | Siguiente paso |
|--------|-----------|----------------|
| Social (seguir/amigos) | ✅ API + sync | Postgres |
| Car Match (likes/swipes) | ✅ API + sync | Postgres |
| Reportes | ✅ API + email admin | Cola + panel moderación |
| Perfiles públicos | ✅ GET + PUT sync + listado Match | Postgres |
| Push tokens | ✅ POST /push-tokens | Envío desde servidor |
| Auth | ✅ JWT Strada (`/api/v1/auth/*`) | Postgres usuarios |
| Push tokens | Supabase | `POST /api/v1/push-tokens` |
| Clubes / rutas / chat | Supabase | Migrar por dominio |
| Stripe / comunidades | Edge Functions | Endpoints en Strada API |

Orden recomendado: **auth propia** → **Postgres** (sustituir JSON en `server/data/`) → **storage de fotos** → **push** → **resto**.

---

## Fase 3 — Producción tiendas

Ver checklist completo en `DEPLOY.md`. Resumen:

### Legal (obligatorio)

- Política de privacidad, términos, cookies y aviso legal en **HTTPS**
- Variables `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_URL`, etc.
- Banner de cookies (ya integrado en web)

### Cuentas desarrollador

- Apple Developer Program (99 €/año)
- Google Play Console (25 € único)

### Build

```bash
eas init
eas build --platform ios --profile production
eas build --platform android --profile production
```

Variables EAS (mismas que `.env` de producción):

- `EXPO_PUBLIC_BACKEND_PROVIDER=strada-api`
- `EXPO_PUBLIC_STRADA_API_URL`
- `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` (hasta migrar auth)
- URLs legales HTTPS

### Revisión App Store / Play

- Cuenta demo documentada para el revisor
- Moderación: flujo de reportes operativo (`POST /api/v1/reports` → `ADMIN_EMAIL`)
- Explicar permisos de ubicación, cámara y fotos en la ficha

### Post-lanzamiento

- Monitorizar `GET /api/v1/health`
- `trackEvent` en analytics (conectar proveedor en `src/lib/analytics.ts`)
- Plan de exportación/borrado de cuenta (RGPD) — hoy vía Supabase functions; replicar en API propia

---

## Endpoints API v1 (contrato estable)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Crear cuenta |
| POST | `/api/v1/auth/login` | No | Iniciar sesión (JWT) |
| GET | `/api/v1/auth/me` | Sí | Perfil de la sesión |
| POST | `/api/v1/auth/password` | Sí | Cambiar contraseña |
| DELETE | `/api/v1/auth/me` | Sí | Borrar cuenta (RGPD) |
| GET | `/api/v1/auth/export` | Sí | Exportar datos (RGPD) |
| GET | `/api/v1/health` | No | Estado del servicio |
| GET | `/api/v1/profiles` | Sí | Listado para Match (`?exclude=&limit=`) |
| GET | `/api/v1/profiles/:email` | No | Perfil público |
| PUT | `/api/v1/profiles/me` | Sí | Actualizar perfil propio |
| POST | `/api/v1/push-tokens` | Sí | Registrar token Expo Push |
| GET/PUT | `/api/v1/social/graph` | Sí | Seguimientos y amistades |
| GET | `/api/v1/match/state` | Sí | Likes recibidos y swipes |
| POST | `/api/v1/match/likes` | Sí | Registrar like |
| POST | `/api/v1/match/swipes` | Sí | Registrar swipe |
| POST | `/api/v1/reports` | Sí | Reportar contenido |

Contrato TypeScript: `src/lib/backend/contracts.ts`  
Tests: `npm run test:backend-contract`

---

## Variables de entorno — referencia rápida

```env
# Backend
EXPO_PUBLIC_BACKEND_PROVIDER=local|supabase|strada-api
EXPO_PUBLIC_STRADA_API_URL=https://api.tu-dominio.com
EXPO_PUBLIC_STRADA_EMAIL_API=https://api.tu-dominio.com

# Transitorio (hasta migrar auth)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Servidor (server/.env)
SUPABASE_URL=          # validar JWT entrante
SUPABASE_ANON_KEY=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=
CORS_ORIGINS=
```

---

## Soporte

Empresa: **LUKACORP SL** — Strada  
Documentación relacionada: `DEPLOY.md`, `SECURITY.md`, `store-listing/`
