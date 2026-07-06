# Strada

**Comunidad de rutas en coche y moto** — descubre rutas, quedadas, clubes, match de vehículos y feed social.

[![CI](https://github.com/Eduuu26/strada/actions/workflows/ci.yml/badge.svg)](https://github.com/Eduuu26/strada/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [DEV-LOCAL.md](./DEV-LOCAL.md) | Arranque en tu PC (API + app web) |
| [LAUNCH.md](./LAUNCH.md) | Publicación App Store / Play Store |
| [DEPLOY.md](./DEPLOY.md) | Despliegue en producción |
| [SECURITY.md](./SECURITY.md) | Controles de seguridad |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de versiones |
| [docs/VERSIONING.md](./docs/VERSIONING.md) | Cómo crear releases y tags |
| [docs/INFRA-X99.md](./docs/INFRA-X99.md) | Servidor de trabajo remoto |

## Inicio rápido (local)

**Requisitos:** Node.js 20+, npm, Git.

```powershell
cd rutas-app
npm install
npm run email-server:install
copy .env.example .env
copy server\.env.example server\.env
```

**Terminal 1 — API** (puerto 8788):

```powershell
npm run dev:api
```

**Terminal 2 — App web** (puerto 8084):

```powershell
npm run dev:web
```

Abre **http://localhost:8084**

### Cuenta demo

| Campo | Valor |
|-------|-------|
| Email | `carlos@strada.es` |
| Contraseña | `StradaDemo1!` |

### Pruebas

```powershell
npm run test:all
```

## Arquitectura

```
┌─────────────┐     JWT / REST      ┌──────────────────┐
│  App Expo   │ ──────────────────► │  Strada API v1   │
│  (cliente)  │   :8788             │  server/         │
└─────────────┘                     └──────────────────┘
```

- **Backend activo:** `strada-api` (auth JWT propia, sin Supabase en local).
- **App:** Expo 52 + React Native + expo-router.
- **Almacenamiento local:** JSON en `server/data/` (desarrollo).

## Estructura del proyecto

```
rutas-app/
├── app/                 # Pantallas (expo-router)
├── src/                 # Componentes, contextos, lógica
├── server/              # API Node.js (auth, social, match)
├── docs/                # Documentación técnica
├── scripts/             # Tests y utilidades
├── assets/              # Estáticos web legacy
└── .github/workflows/   # CI y releases
```

## Versiones

| Versión | Fecha | Notas |
|---------|-------|-------|
| [1.0.0](CHANGELOG.md#100---2026-07-06) | 2026-07-06 | Primera release documentada, backend propio |

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo.

## Variables de entorno

Copia los `.env.example` — **nunca subas** `.env` ni `server/.env` a Git.

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_PROVIDER` | `strada-api` (recomendado) |
| `EXPO_PUBLIC_STRADA_API_URL` | URL del API (local: `http://127.0.0.1:8788`) |
| `STRADA_JWT_SECRET` | Secreto JWT (solo servidor) |

## Licencia

Proyecto privado — `stefansebastean@gmail.com`
