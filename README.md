# Strada

**Comunidad de rutas en coche y moto por España** — descubre rutas, quedadas, navegación en grupo y feed social.

## Inicio rápido (web)

Necesitas **dos terminales**:

```bash
cd rutas-app
npm run email-server:install
cp server/.env.example server/.env
# Edita server/.env y pon SMTP_PASS (contraseña de aplicación de Gmail)

npm run email-server
```

```bash
cd rutas-app
python -m http.server 8787
```

Abre **http://127.0.0.1:8787/** (o `index.html`).

### Web con Supabase (producción)

Edita `assets/js/strada-config.js` con tu URL y anon key de Supabase (ver `strada-config.example.js`).

### Email de peticiones de club

Cuando alguien solicita un club, Strada envía un correo a **eslukacs2004@gmail.com**. Al aprobar o rechazar, el solicitante también recibe email.

1. En Gmail: activa verificación en 2 pasos → [Contraseñas de aplicación](https://myaccount.google.com/apppasswords).
2. Copia `server/.env.example` → `server/.env` y rellena `SMTP_PASS`.
3. Arranca el servidor: `npm run email-server` (puerto **8788**).
4. En web, `index.html` ya apunta a `http://127.0.0.1:8788`. En Expo, crea `.env` con:
   ```
   EXPO_PUBLIC_STRADA_EMAIL_API=https://tu-api.railway.app
   ```
   En emulador Android usa `http://10.0.2.2:8788` en lugar de `127.0.0.1`.

Si el servidor de email no está activo, la solicitud se guarda igual en la app; solo falla el envío del correo (ver consola).

## App móvil y web (Expo) — recomendado

```bash
npm install
cp .env.example .env   # opcional: backend actual (Supabase) o futuro servidor propio
npm run dev:web        # http://localhost:8082
```

En otra terminal (email de clubes):

```bash
npm run email-server:install
cp server/.env.example server/.env
npm run email-server
```

### Pruebas rápidas

```bash
npm run e2e:expo          # smoke de rutas web Expo (con dev:web activo)
npm run test:group-location
```

> **Nota:** El backend actual usa Supabase, pero está prevista la migración a un servidor propio. La app usa `isBackendConfigured()` para abstraer el origen de datos.

## Web estática legacy

## Estructura

```
rutas-app/
├── index.html              # App web principal (Strada)
├── assets/css/app.css      # Diseño profesional
├── assets/js/app.js        # Lógica de la app
├── assets/js/strada-config.js   # Supabase + email API (web)
├── assets/js/supabase-web.js    # Auth y sync en navegador
├── server/                 # API de email (nodemailer + Gmail)
├── app/(tabs)/             # Explorar, Rutas, Quedadas, Conducir, Perfil
├── src/components/         # UI reutilizable
├── src/context/            # Estado (auth, rutas, feed)
└── preview.html            # Redirige a index.html
```

## Funcionalidades

| Área | Descripción |
|------|-------------|
| **Explorar** | Feed social con fotos, likes y comentarios |
| **Rutas** | Rutas de la comunidad con foto y descripción |
| **Quedadas** | Eventos con fecha y navegación a punto de encuentro |
| **Conducir** | Mapa interactivo estilo navegación + Waze/Maps |
| **Perfil** | Garaje de vehículos, avatar y progreso |

Los datos de la web usan **Supabase** cuando `assets/js/strada-config.js` está configurado; si no, modo demo en `localStorage`.

## Publicar en App Store y Google Play

Guía completa en **[DEPLOY.md](./DEPLOY.md)**. Controles de seguridad en **[SECURITY.md](./SECURITY.md)**.

## Próximos pasos

- Mapbox en móvil para navegación nativa
- Notificaciones push para quedadas
- Sincronizar rutas/feed/chats con Supabase (clubes y auth ya preparados)
