# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Versionado según [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-07-06

### Añadido

- App Strada (Expo 52) — rutas, clubes, comunidades, match, chats, feed.
- API propia `strada-api` en `server/` (auth JWT, perfiles, social, match).
- Desarrollo local sin Supabase (`EXPO_PUBLIC_BACKEND_PROVIDER=strada-api`).
- Scripts de arranque: `npm run dev:api`, `npm run dev:web`.
- Suite de pruebas: `npm run test:all` (41 tests).
- Documentación: `DEV-LOCAL.md`, `LAUNCH.md`, `DEPLOY.md`, `SECURITY.md`.

### Cambiado

- Migración en curso de Supabase hacia backend propio.
- `.gitignore` excluye credenciales, `supabase/` y logs locales.

### Eliminado

- Scripts de deploy a Supabase Edge Functions del `package.json`.
- Credenciales Supabase de archivos versionables.

### Infraestructura

- Servidor `x99` (Tailscale `100.66.89.32`) limpiado y preparado para trabajo remoto.
- AnyDesk ID: `773354590`.

[1.0.0]: https://github.com/Eduuu26/strada/releases/tag/v1.0.0
