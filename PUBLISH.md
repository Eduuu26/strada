# Publicar Strada en App Store y Google Play (sin dominio propio)

## Ya configurado

| Pieza | Estado |
|-------|--------|
| Código GitHub | https://github.com/Eduuu26/strada |
| Docs legales HTTPS | https://eduuu26.github.io/strada/ |
| API producción (x99) | `https://sponsored-rpg-greetings-consumers.trycloudflare.com` |
| `eas.json` production | URLs API + legales |
| Cuenta demo revisores | `carlos@strada.es` / `StradaDemo1!` |

## URLs legales (App Store / Play Store)

| Documento | URL |
|-----------|-----|
| Privacidad | https://eduuu26.github.io/strada/privacy-policy.html |
| Términos | https://eduuu26.github.io/strada/terms-of-service.html |

No hace falta dominio propio — GitHub Pages vale para las tiendas.

## API (tu servidor x99)

HTTPS público vía **Cloudflare Tunnel** (gratis, sin dominio).

```powershell
cd C:\Users\Eduardo\Desktop\www\rutas-app
.\scripts\deploy-x99.ps1
.\scripts\connect-x99-api.ps1   # lee deploy/x99/api-url.txt
```

> Si reinicias el túnel Cloudflare, la URL puede cambiar. Actualiza `deploy/x99/api-url.txt` y vuelve a ejecutar `connect-x99-api.ps1` antes de un build nuevo.

## Publicar — 4 pasos tuyos

### 1. Login Expo (una vez)

```powershell
eas login
```

### 2. Vincular proyecto EAS

```powershell
eas init
```

### 3. Build producción

```powershell
eas build --platform android --profile production
eas build --platform ios --profile production
```

### 4. Subir a tiendas

```powershell
eas submit --platform android --latest
eas submit --platform ios --latest
```

Completa en `eas.json`: `appleTeamId` y `ascAppId` (App Store Connect).

Android: coloca `store-listing/google-play-service-account.json` (clave de Play Console).

## Capturas

`store-listing/screenshots/` — mínimo 2 Android, 3 iPhone.
