# Strada — desarrollo local

## Requisitos instalados

- Node.js 24 + npm
- Git
- Expo CLI (via `npx expo`)

## Arranque rápido

### Terminal 1 — API local (puerto 8788)

```powershell
cd C:\Users\Eduardo\Desktop\www\rutas-app
npm run email-server
```

### Terminal 2 — App web

```powershell
cd C:\Users\Eduardo\Desktop\www\rutas-app
npx expo start --web --port 8084
```

Abre: http://localhost:8084

## Cuenta demo

- Email: `carlos@strada.es`
- Contraseña: `StradaDemo1!`

## Backend

Modo activo: **strada-api** (sin Supabase).

Variables en `.env` y `server/.env` (no se suben a Git).

## Pruebas

```powershell
npm run test:backend-contract
npm run test:social
```

## Próximos pasos para la app

1. Desarrollar pantallas en `app/` y lógica en `src/`
2. API nueva en `server/v1.mjs`
3. Cuando quieras móvil: `npx expo start` + Expo Go
4. Build producción: ver `LAUNCH.md`

## GitHub

No subir: `.env`, `server/.env`, `assets/js/strada-config.js`, carpeta `supabase/`.
