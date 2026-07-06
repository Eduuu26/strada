# Publicar Strada en App Store y Google Play

Guía paso a paso para llevar Strada a producción.

---

## Resumen del checklist

- [ ] Cuenta Apple Developer (99 €/año)
- [ ] Cuenta Google Play Console (25 € una vez)
- [ ] Proyecto Supabase (backend)
- [ ] Servidor de email en Railway/Render
- [ ] Política de privacidad publicada en URL pública
- [ ] `eas init` + build de producción
- [ ] Ficha en App Store Connect y Play Console
- [ ] Submit con `eas submit`

---

## 1. Backend — Supabase

### Crear proyecto

1. Ve a [supabase.com](https://supabase.com) → New project.
2. Anota **Project URL** y **anon public key** (Settings → API).

### Aplicar base de datos

Opción A — CLI:

```bash
npm install -g supabase
cd rutas-app
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Opción B — SQL Editor en el dashboard: pega el contenido de  
`supabase/migrations/20250626120000_initial_schema.sql` y ejecuta.

### Auth

En Supabase → Authentication → Providers → Email: activado.  
Desactiva «Confirm email» para pruebas rápidas (o actívalo en producción real).

### Variables en la app

Crea `.env` en la raíz de `rutas-app`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
EXPO_PUBLIC_STRADA_EMAIL_API=https://tu-api-email.railway.app
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://tu-dominio.com/privacy-policy.html
```

EAS Build también necesita estas variables → ver sección 4.

---

## 2. Servidor de email (producción)

### Railway (recomendado)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub (carpeta `server/`).
2. Variables de entorno (copia de `server/.env.example`):

| Variable | Valor |
|----------|--------|
| `SMTP_USER` | eslukacs2004@gmail.com |
| `SMTP_PASS` | Contraseña de aplicación Gmail |
| `ADMIN_EMAIL` | eslukacs2004@gmail.com |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key (verificación JWT) |
| `SMTP_USER` / `SMTP_PASS` | Gmail SMTP |
| `ADMIN_EMAIL` | eslukacs2004@gmail.com |
| `CORS_ORIGINS` | Orígenes web permitidos |

3. Railway te dará una URL pública → úsala en `EXPO_PUBLIC_STRADA_EMAIL_API`.

### Docker local

```bash
cd server
docker build -t strada-email .
docker run -p 8788:8788 --env-file .env strada-email
```

---

## 3. Política de privacidad

1. Sube `docs/privacy-policy.html` a:
   - GitHub Pages, Netlify, o tu dominio.
2. La URL debe ser **HTTPS** y accesible públicamente.
3. Pon la URL en:
   - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
   - App Store Connect → App Privacy
   - Google Play Console → Política de privacidad

---

## 4. EAS (Expo Application Services)

### Instalación

```bash
npm install -g eas-cli
cd rutas-app
npm install
eas login
eas init
```

`eas init` creará un **project ID** — se guardará en `app.config.ts` → `extra.eas.projectId`.

### Secretos para builds de producción

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --scope project --name EXPO_PUBLIC_STRADA_EMAIL_API --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value "https://..."
```

### Builds

```bash
# iOS (para App Store)
eas build --platform ios --profile production

# Android (AAB para Play Store)
eas build --platform android --profile production

# Prueba interna (APK Android)
eas build --platform android --profile preview
```

---

### Web estática

Edita `assets/js/strada-config.js`:

```javascript
window.STRADA_CONFIG = {
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...',
  emailApi: 'https://tu-api.railway.app',
  privacyPolicyUrl: 'https://tu-dominio.com/privacy-policy.html',
};
```

Sirve con cualquier hosting estático (GitHub Pages, Netlify, Apache).

---

## 5. Apple App Store

### Cuenta

1. [developer.apple.com/programs](https://developer.apple.com/programs/) — inscripción 99 €/año.
2. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → + → New App.
3. Bundle ID: `es.strada.app` (debe coincidir con `app.config.ts`).

### Certificados

EAS los gestiona automáticamente en el primer build iOS. Acepta cuando `eas build` lo solicite.

### Ficha de la tienda

Usa textos de `store-listing/app-store-es.md`.

- Capturas: mínimo 3 en iPhone 6.7"
- Icono: generado en `assets/icon.png`
- Política de privacidad: URL pública
- Clasificación: 12+, ubicación, UGC

### Submit

Edita `eas.json` → `submit.production.ios` con tu `appleTeamId` y `ascAppId`.

```bash
eas submit --platform ios --latest
```

---

## 6. Google Play

### Cuenta

1. [play.google.com/console](https://play.google.com/console) — 25 € registro único.
2. Crear aplicación → nombre Strada, idioma español.

### Firma

EAS genera el keystore en el primer build Android (guárdalo — EAS lo almacena).

### Submit automático (opcional)

1. Play Console → Setup → API access → Service account.
2. Descarga JSON → guárdalo como `store-listing/google-play-service-account.json` (está en `.gitignore`).
3. `eas submit --platform android --latest`

### Ficha

Usa `store-listing/play-store-es.md`.

---

## 7. Cuenta de administrador

El email `eslukacs2004@gmail.com` es administrador de peticiones de club.

Regístrate en la app con ese correo (vía Supabase Auth) para aprobar/rechazar clubes.

---

## 8. Después del lanzamiento

```bash
# Nueva versión
# 1. Sube version en app.config.ts (version + ios.buildNumber / android.versionCode)
# 2. Build y submit
eas build --platform all --profile production
eas submit --platform all --latest
```

### Actualizaciones OTA (opcional)

```bash
npx expo install expo-updates
eas update --branch production --message "Fix clubes"
```

---

## Estructura creada

```
rutas-app/
├── app.config.ts          # Config Expo + tiendas
├── eas.json               # Perfiles build/submit
├── assets/icon.png        # Icono App Store / Play
├── supabase/              # Schema y migraciones
├── server/                # API email + Dockerfile + Railway
├── docs/privacy-policy.html
├── store-listing/         # Textos para tiendas
└── src/lib/supabase/      # Cliente producción
```

---

## Soporte

Contacto: eslukacs2004@gmail.com
