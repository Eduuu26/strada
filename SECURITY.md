# Seguridad — Strada

Controles implementados y buenas prácticas para mantener la app fiable.

## Resumen de controles

| Área | Control |
|------|---------|
| **Base de datos** | Row Level Security (RLS) estricto en Supabase |
| **Administración** | Tabla `platform_admins`; solo admins aprueban clubes (servidor + RLS) |
| **Email** | JWT de Supabase (no claves en el cliente); rate limiting; validación de payload |
| **Contraseñas** | Mín. 10 caracteres + mayúscula + minúscula + número |
| **Login** | Bloqueo tras 5 intentos fallidos (15 min) |
| **Web XSS** | `escapeHtml()` en chats, feed y avatares; CSP en `index.html` |
| **API servidor** | Helmet, límite JSON 32 KB, CORS restrictivo en producción |
| **Perfiles** | Búsqueda vía RPC `search_profiles_safe` (anti-inyección) |
| **Privacidad** | Política publicada en `docs/privacy-policy.html` |

---

## Supabase (producción obligatoria)

1. Ejecuta **ambas** migraciones:
   - `supabase/migrations/20250626120000_initial_schema.sql`
   - `supabase/migrations/20250626130000_security_rls.sql`

2. Verifica en el dashboard que RLS está **activado** en todas las tablas.

3. Añade administradores solo en `platform_admins` (no en código cliente).

4. En Authentication → Settings:
   - Contraseña mínima: 10 caracteres
   - Considera activar confirmación de email en producción

---

## Servidor de email

Variables obligatorias en **producción** (`NODE_ENV=production`):

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SMTP_USER=...
SMTP_PASS=...
ADMIN_EMAIL=administracion@strada.com
CORS_ORIGINS=https://tu-dominio.com
```

El cliente envía `Authorization: Bearer <jwt_supabase>`:
- **club-request**: solo si el JWT coincide con `requesterEmail`
- **club-decision**: solo si el JWT es del admin

---

## App móvil (Expo)

- **No** uses `EXPO_PUBLIC_STRADA_EMAIL_API_KEY` (eliminado por diseño).
- Configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` vía EAS Secrets.
- La anon key es pública; la seguridad depende de **RLS**, no de ocultar la clave.

---

## Web (`assets/js/app.js`)

Con **Supabase** configurado en `assets/js/strada-config.js`, la web usa el mismo auth y datos en la nube que la app móvil (perfiles, clubes, email JWT).

Sin Supabase (campos vacíos), la web funciona en modo demo local (`localStorage`) — solo para desarrollo.

### Activar Supabase en web

1. Copia `assets/js/strada-config.example.js` → `assets/js/strada-config.js`
2. Rellena `supabaseUrl` y `supabaseAnonKey`
3. Aplica migraciones SQL (incl. `20250626140000_profile_lookup.sql`)
4. Arranca el servidor de email con `SUPABASE_URL` y `SUPABASE_ANON_KEY`

---

## Checklist pre-lanzamiento

- [ ] Migración `20250626130000_security_rls.sql` aplicada
- [ ] `platform_admins` con emails correctos
- [ ] Servidor email con `NODE_ENV=production` y variables completas
- [ ] Sin secretos en `index.html` ni en `.env` commiteado
- [ ] Política de privacidad en URL HTTPS pública
- [ ] Cuenta de prueba para revisión de Apple/Google
- [ ] Revisar logs del servidor de email tras las primeras 24 h

---

## Reportar vulnerabilidades

Contacto: **administracion@strada.com**
