# Publicar Strada — estado y pasos restantes

## Hecho automáticamente

- [x] Código en GitHub: https://github.com/Eduuu26/strada
- [x] Release v1.0.0
- [x] GitHub Pages workflow (docs legales HTTPS)
- [x] API en servidor x99 (`deploy/x99/`, scripts `deploy-x99.ps1`)
- [x] Dockerfile del servidor corregido
- [x] URLs legales en `app.config.ts` y `eas.json`
- [x] `.env.production.example`

## URLs legales (tras activar Pages)

| Documento | URL |
|-----------|-----|
| Índice | https://eduuu26.github.io/strada/ |
| Privacidad | https://eduuu26.github.io/strada/privacy-policy.html |
| Términos | https://eduuu26.github.io/strada/terms-of-service.html |

**Activar Pages:** GitHub → repo `strada` → Settings → Pages → Source: **GitHub Actions**

# API en producción (servidor x99 — siempre encendido)

La API corre en **tu servidor x99** con Docker + Caddy. Datos en `/mnt/M5/strada-api/data`.

```powershell
cd C:\Users\Eduardo\Desktop\www\rutas-app
.\scripts\deploy-x99.ps1
.\scripts\connect-x99-api.ps1 -ApiUrl "https://api.strada.es"
```

**DNS:** crea un registro `A` → `api.strada.es` → `85.56.205.160` (IP pública del servidor).

**Router:** abre puertos **80** y **443** hacia x99.

> Render no se usa. Puedes borrar el blueprint en dashboard.render.com si quieres.

## EAS Build

```powershell
npm install -g eas-cli
cd C:\Users\Eduardo\Desktop\www\rutas-app
eas login
eas init
.\scripts\setup-eas-production.ps1
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Submit a tiendas

```powershell
eas submit --platform android --latest
eas submit --platform ios --latest
```

Completa en `eas.json`: `appleTeamId` y `ascAppId` desde App Store Connect.

## Cuenta demo (revisores)

- Email: `carlos@strada.es`
- Contraseña: `StradaDemo1!`

## Capturas

Carpeta: `store-listing/screenshots/` — mínimo 2 Android, 3 iPhone.
