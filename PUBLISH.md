# Publicar Strada — estado y pasos restantes

## Hecho automáticamente

- [x] Código en GitHub: https://github.com/Eduuu26/strada
- [x] Release v1.0.0
- [x] GitHub Pages workflow (docs legales HTTPS)
- [x] `render.yaml` para API en producción
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

## API en producción (Render — 5 min)

1. https://dashboard.render.com → **New** → **Blueprint**
2. Conecta el repo `Eduuu26/strada`
3. Añade variables secretas: `SMTP_USER`, `SMTP_PASS` (Gmail app password)
4. Deploy → copia la URL (ej. `https://strada-api.onrender.com`)
5. Ejecuta `.\scripts\setup-eas-production.ps1` con esa URL

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
