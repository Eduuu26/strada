# Fase 1 — Plataforma de comunidades de pago

Registro de avance de la Fase 1 (MVP). Una sección por hito.

---

## Hito 1.0 — Cimientos (✅ entregado)

Objetivo: poner los cimientos de datos del nuevo módulo **sin romper nada** de
lo que ya funciona (clubs gratis, rutas/quedadas jsonb, feed, chats, auth).

### Qué se ha añadido

| Artefacto | Ruta | Notas |
|---|---|---|
| Migración PostGIS + tablas nuevas | `supabase/migrations/20250626150000_phase1_paid_platform.sql` | 100% aditiva |
| Contratos TypeScript compartidos | `packages/shared/` | `@strada/shared` |
| Variables de entorno | `.env.example` (ampliado) | Mapbox, Stripe, MITECO, fee |

### Decisiones de diseño (importante)

1. **`profiles` es la entidad usuario.** No se crea la tabla `users` del documento
   de referencia: `public.profiles` ya extiende `auth.users` y su `id = auth.uid()`.
   Todas las FK de usuario apuntan a `profiles(id)`.
2. **`community_routes` en vez de `routes`.** La tabla `public.routes` (legacy, jsonb)
   ya existe. Para que **convivan** los dos mundos (clubs gratis y comunidades de
   pago), la tabla geoespacial nueva se llama `community_routes`. La consulta de
   gasolineras del documento (`JOIN routes`) pasa a `JOIN community_routes`.
3. **El acceso al contenido depende de `memberships.status = 'active'`**, comprobado
   por RLS con los helpers `is_active_member()` e `is_community_manager()`.
4. **El estado de la suscripción lo fija Stripe vía webhook** (con `service_role`,
   que ignora RLS). El cliente solo puede auto-inscribirse como `member` / `inactive`.
5. **Gasolineras de solo lectura** para clientes; las escribe el cron de ingesta con
   `service_role`. **Trazas GPS anónimas** (sin `user_id`) por RGPD.

### Tablas creadas

`communities`, `memberships`, `community_routes`, `route_stops`, `fuel_stations`,
`live_sessions`, `live_messages`, `gps_traces` — todas con RLS e índices GIST sobre
las columnas `geography`.

### Cómo aplicar la migración

Requiere un proyecto Supabase. Opción A (CLI):

```bash
cd rutas-app
supabase db push
```

Opción B (manual): pega el contenido del `.sql` en el **SQL Editor** de Supabase.

> Si `create extension postgis` falla por permisos, actívalo desde el dashboard:
> **Database → Extensions → postgis → Enable**, y vuelve a aplicar la migración.

### Verificación (DoD)

- [ ] La migración corre sin errores y `postgis` queda instalada.
- [ ] Existen las 8 tablas nuevas con sus índices GIST (`\d+ public.community_routes`).
- [ ] Las tablas legacy (`clubs`, `routes`, `meetups`, …) siguen intactas.
- [ ] La app actual (móvil y web) sigue funcionando igual que antes.

### Pendiente de configurar por ti

- Proyecto Supabase (URL + anon key + **service role** para backend).
- Token de **Mapbox** (Hito 1.3).
- Claves de **Stripe test** y `PLATFORM_FEE_PERCENT` (Hito 1.5).

---

## Hito 1.1 — Preferencias de perfil ✅

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| Migración perfiles | `supabase/migrations/20250626160000_profiles_vehicle_prefs.sql` | Añade `vehicle_type` y `fuel_pref` a `profiles` (aditivo, con `CHECK`) |
| Tipos | `src/types.ts` | `VehiclePreference` (`coche`/`moto`/`ambos`) y `FuelPreference` (`95`/`98`/`diesel`/`gnc`) en `User` |
| Constantes | `src/lib/preferences.ts` | Opciones + etiquetas + type guards reutilizables |
| Formulario | `src/components/VehiclePreferencesForm.tsx` | Selector de chips para tipo de vehículo y combustible |
| Pantalla | `app/(tabs)/profile.tsx` | Integra el formulario en el perfil |
| Datos | `src/lib/supabase/mappers.ts`, `profileRepository.ts` | Lectura/escritura de las nuevas columnas |
| Auth | `src/context/AuthContext.tsx`, `SupabaseAuthProvider.tsx` | Nuevo `updatePreferences()` que persiste |

### Decisiones

1. **`vehicle_type`/`fuel_pref` son preferencias de perfil**, independientes del **garaje** (`vehicles`). El garaje describe vehículos concretos; estas dos guían el filtrado de gasolineras por octanaje (Hito 1.4) y rutas.
2. **Columnas opcionales con `CHECK`**: nada se rompe para usuarios existentes (quedan `NULL` = "Sin definir").
3. **`updatePreferences` añadido a los dos providers** (local y Supabase) para mantener paridad cuando se conecte Supabase.

### Verificación (DoD)

- [ ] Un usuario se registra, inicia sesión y edita su perfil (tipo de vehículo y octanaje).
- [ ] Los valores persisten tras recargar (en local) y se guardan en `profiles` (con Supabase).
- [ ] El garaje de vehículos sigue funcionando igual.

### Pendiente

- Réplica en **web-legacy** (`assets/js/app.js`) si se quiere paridad; se mantiene congelada por ahora.

---

## Hito 1.2 — Comunidades + roles + membresías ✅ (capa de datos/lógica)

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| Triggers | `supabase/migrations/20250626170000_community_membership_triggers.sql` | Owner→membresía activa al crear comunidad; auto-activación en comunidades gratis |
| Tipos | `src/types.ts` | `Community`, `Membership`, roles y estados (réplica de `@strada/shared`) |
| Lógica pura | `src/lib/communities.ts` | Roles, `isActiveMember`, `canManageCommunity`, `formatPrice`, `slugify`, validación |
| Repositorio | `src/lib/supabase/communitiesRepository.ts` | CRUD de comunidades + alta/baja de membresías |
| Contexto | `src/context/CommunitiesContext.tsx` | Estado + acciones (crear/unirse/salir) sobre el repositorio |
| Wiring | `src/context/AppDataProviders.tsx` | `CommunitiesProvider` añadido al árbol |

### Decisiones

1. **"Inactive hasta pago" garantizado por la base de datos**: el cliente solo puede auto-inscribirse como `('member','inactive')` (RLS del 1.0). La activación real la hará Stripe (Hito 1.5).
2. **Membresía del owner creada por trigger** (`security definer`): la RLS impide que el cliente cree una membresía `('owner','active')`, así que la genera el servidor al insertar la comunidad.
3. **Comunidades gratuitas (`price_cents = 0`) se activan solas** vía trigger al unirse, sin pasar por Stripe.
4. **Tipos replicados en el app** en vez de importar `@strada/shared`, porque el paquete aún no está enlazado como dependencia del Expo (eso llega con el monorepo). `@strada/shared` sigue siendo el contrato canónico.
5. **Sin pantallas todavía**: se entrega la capa durable (datos + lógica). La UI de comunidades se hará cuando Supabase esté conectado, para no construir mocks locales desechables.

### Verificación (DoD)

- [ ] Aplicadas las migraciones 1.0 + 1.2, un usuario crea una comunidad y aparece como `owner`/`active`.
- [ ] Otro usuario se une: en comunidad gratis queda `active`; en comunidad de pago queda `inactive`.
- [ ] La RLS impide ver el contenido de una comunidad privada sin membresía activa.

### Pendiente

- Pantallas de comunidades (lista / detalle / crear / unirse) — siguiente paso.
- Activación real por pago (Hito 1.5, Stripe Connect + webhooks).

---

## Hito 1.3 — Rutas de comunidad ✅ (dominio + backend; UI con mapa pendiente)

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| RPC GeoJSON↔PostGIS | `supabase/migrations/20250626180000_community_routes_rpc.sql` | `create_community_route` y `get_community_routes` (traducen geometría, respetan RLS) |
| Tipos | `src/types.ts` | `CommunityRoute`, `RouteStop`, `GeoLineString`, `GeoPoint`, `LngLat`, enums |
| Helpers GeoJSON | `src/lib/routeGeo.ts` | Distancia haversine, longitud de polilínea, bounds, centro, validación, formato |
| Repositorio | `src/lib/supabase/communityRoutesRepository.ts` | Crear/leer/publicar/archivar/borrar rutas vía RPC |
| Hook | `src/hooks/useCommunityRoutes.ts` | Estado + acciones por comunidad (auto-calcula distancia) |

### Decisiones

1. **GeoJSON en la app, `GEOGRAPHY(4326)` en la BD**: PostgREST no serializa geografía a GeoJSON, así que dos RPC traducen en ambos sentidos.
2. **RPC `SECURITY INVOKER`**: la RLS del Hito 1.0 sigue mandando (solo gestores escriben; miembros activos leen publicadas).
3. **Distancia auto-calculada** desde la geometría si no se aporta (`lineDistanceMeters`).
4. **Helpers GeoJSON en módulo aparte** (`routeGeo.ts`) para no colisionar con `geo.ts` (que usa `{latitude, longitude}` para clubs).
5. **UI con mapa aplazada**: el panel Next.js de dibujo y el visor móvil requieren **token de Mapbox** y elegir/instalar librería de mapa (decisión de infra). El dominio entregado los alimenta a ambos por igual.

### Verificación (DoD)

- [ ] Aplicada la migración 1.3, un gestor crea una ruta con paradas (GeoJSON) y se guarda como `GEOGRAPHY`.
- [ ] `get_community_routes` devuelve la geometría como GeoJSON + paradas anidadas.
- [ ] Un miembro activo ve solo rutas `published`; un no-miembro no ve nada (RLS).

### Pendiente

- Panel Next.js (Mapbox Draw) para trazar rutas — necesita token Mapbox.
- Visor de ruta en móvil (librería de mapa) — necesita decisión de dependencia.

---

## Hito 1.4 — Gasolineras MITECO + consulta por octanaje ✅ (código listo)

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| RPC PostGIS | `supabase/migrations/20250627120000_fuel_rpc.sql` | `upsert_fuel_stations` (ingesta) + `fuel_stations_near_route` (consulta) |
| Edge Function | `supabase/functions/ingest-fuel-stations/index.ts` | Descarga MITECO, parsea y upsertea por lotes (cron) |
| Tipo | `src/types.ts` | `FuelStationNearRoute` |
| Repositorio | `src/lib/supabase/fuelStationsRepository.ts` | `fetchFuelStationsNearRoute(routeId, fuelKey, radiusM)` |
| Hook | `src/hooks/useFuelStationsNearRoute.ts` | Lista + más barata, filtrada por combustible |

### Decisiones

1. **Claves de precio = valores de `fuel_pref`** (`95`/`98`/`diesel`/`gnc`): se consulta el octanaje del perfil directamente sobre el `jsonb` `prices`.
2. **Geometría construida en SQL** (`upsert_fuel_stations` recibe lng/lat y hace `ST_MakePoint`), así la Edge Function no maneja WKB.
3. **`upsert_fuel_stations` solo `service_role`** (la llama la ingesta); **`fuel_stations_near_route` `SECURITY INVOKER`**: si la ruta no es visible para el usuario, no devuelve gasolineras.
4. **Ingesta idempotente** por `id` (IDEESS); descarta estaciones sin coordenadas ni precios útiles.
5. **Cron**: se programa al desplegar (`supabase functions schedule` o `pg_cron + net.http_post`); recomendado cada 12 h.

### Verificación (DoD)

- [ ] Desplegada la función e invocada, `fuel_stations` se llena (miles de filas).
- [ ] `fuel_stations_near_route(route, '95', 2000)` devuelve estaciones ordenadas por distancia con su precio.
- [ ] Un usuario sin acceso a la ruta no obtiene resultados.

### Pendiente

- Desplegar la Edge Function y programar el cron (necesita proyecto Supabase + `service_role`).
- UI que muestre las gasolineras sobre la ruta (va con el visor de mapa del 1.3).

---

## Hito 1.5 — Stripe Connect + webhooks ✅ (código listo)

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| Migración | `supabase/migrations/20250627130000_stripe_billing.sql` | `profiles.stripe_customer_id` + RPC `apply_subscription_status` (service_role) |
| Utilidades | `supabase/functions/_shared/` | Cliente Stripe (Deno), clientes Supabase (user/service), CORS |
| Onboarding | `supabase/functions/stripe-connect-onboard/` | El owner conecta su cuenta Express |
| Checkout | `supabase/functions/create-checkout-session/` | Suscripción mensual con comisión + reparto al owner |
| Webhook | `supabase/functions/stripe-webhook/` | Traduce eventos Stripe → `memberships.status` |
| Cliente | `src/lib/supabase/billingRepository.ts` | Invoca las funciones, devuelve URLs |
| Contexto | `src/context/CommunitiesContext.tsx` | `subscribe()` y `connectStripe()` |

### Decisiones

1. **El webhook es la única vía que activa membresías de pago** (`apply_subscription_status`, `service_role`); el cliente nunca pone `active` (RLS).
2. **Destination charge + `application_fee_percent`**: la plataforma cobra `PLATFORM_FEE_PERCENT` y el resto va a la cuenta conectada del owner.
3. **Producto/precio se crean perezosamente** la primera vez que alguien paga una comunidad, y se cachean en `communities.stripe_product_id/price_id`.
4. **Un cliente Stripe por usuario** (`profiles.stripe_customer_id`), reutilizado en cada suscripción.
5. **Mapeo de estados**: `active/trialing→active`, `past_due/unpaid→past_due`, `canceled/incomplete_expired→canceled`, resto→`inactive`.

### Verificación (DoD)

- [ ] El owner completa onboarding y la comunidad guarda `stripe_account_id`.
- [ ] Un usuario paga y, tras el webhook, su membresía pasa a `active` (ve el contenido).
- [ ] Un fallo de pago la pone `past_due`; una cancelación, `canceled`.

### Pendiente de configurar

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PLATFORM_FEE_PERCENT` en los secrets de las funciones.
- Registrar el endpoint del webhook en el dashboard de Stripe.
- Deep links reales de `success/cancel/return` (ahora placeholders `https://strada.app/...`).

---

## Hito 1.6 — Tráfico del proveedor de mapas ✅ (capa de configuración)

> **Alcance real**: en Fase 1 el tráfico es el del **proveedor** (Mapbox), no
> propio (Fase 2, `gps_traces`). No tiene backend: es configuración + capa de
> mapa. Se entrega la parte **durable e independiente de la librería**; el
> render del tráfico llega con el componente de mapa (necesita token + lib).

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| Env | `src/lib/env.ts` | `getMapboxToken()` + `isMapsConfigured()` |
| Config mapas | `src/lib/maps/config.ts` | Proveedor, estilos (incl. tráfico), fuente de tráfico, centro/zoom |

### Decisiones

1. **Capa agnóstica del componente**: expone token, estilos y centro/zoom; no se acopla a `react-native-maps` ni a `@rnmapbox/maps`. Cuando se elija la librería, el visor consume esto sin cambios de contrato.
2. **Tráfico vía estilos `navigation-*-v1`** de Mapbox (incluyen flujo en tiempo real) o, alternativamente, la **fuente `mapbox-traffic-v1`** para superponer sobre un estilo propio.
3. **Centro por defecto en Madrid**, coherente con `DEFAULT_GEO` de `geo.ts`.

### Pendiente

- Elegir e instalar la **librería de mapa** y aportar `EXPO_PUBLIC_MAPBOX_TOKEN`.
- Render del visor con la capa de tráfico activable (va junto al visor de rutas del 1.3 y las gasolineras del 1.4).

---

## Hito 1.7 — Walkie-talkie nivel 1 (avisos push) ✅ (código listo)

### Qué se ha entregado

| Artefacto | Ruta | Qué es |
|---|---|---|
| Migración | `supabase/migrations/20250627140000_push_tokens.sql` | `push_tokens` (RLS por usuario) + RPC `active_member_push_tokens` |
| Edge Function | `supabase/functions/send-live-alert/` | Gestor difunde aviso → `live_message` + Expo Push a miembros activos |
| Cliente tokens | `src/lib/supabase/pushTokensRepository.ts` | Alta/baja de token de dispositivo |
| Cliente avisos | `src/lib/supabase/liveAlertsRepository.ts` | `sendLiveAlert(routeId, body)` |
| Registro push | `src/hooks/usePushRegistration.ts` + `src/components/PushRegistrar.tsx` | Pide permiso, obtiene el token Expo y lo guarda al iniciar sesión |

### Decisiones

1. **Autorización por RLS, no por código**: la función inserta la sesión/el mensaje con el cliente del usuario; solo los gestores pueden (políticas `live_*`). Si no eres gestor, falla limpio.
2. **`pushTokensRepository` no importa `expo-notifications`**: recibe el token ya obtenido. Así la capa de datos no se acopla a una librería de cliente **aún no instalada** (evita romper el build).
3. **Difusión solo a miembros `active`** (RPC con `service_role`); respeta el modelo de pago.
4. **Nivel 1 = texto** (`kind = 'alerta'`); la voz en directo (LiveKit) es Fase 2.

### Verificación (DoD)

- [ ] Un gestor envía un aviso y los miembros activos reciben la notificación.
- [ ] Un miembro no-gestor no puede enviar (403).
- [ ] El aviso queda registrado en `live_messages`.

### Pendiente de configurar

- `npm install` (añadidas `expo-notifications` y `expo-device` al `package.json`).
- `projectId` de EAS para `getExpoPushTokenAsync` (lo toma de `expoConfig.extra.eas.projectId`).
- Desplegar la función; `EXPO_ACCESS_TOKEN` opcional para límites/seguridad.

---

## UI de comunidades (móvil) ✅

Primera capa visible que da forma a los hitos 1.2–1.7.

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Pestaña Comunidades | `app/(tabs)/communities.tsx` | Lista "Mis comunidades" + "Descubrir" (públicas) |
| Crear comunidad | `app/community/create.tsx` | Nombre, descripción, visibilidad, precio (€→céntimos) |
| Detalle | `app/community/[id].tsx` | Ciclo unirse/suscribir/pagar, contenido para activos, panel de gestor |
| Crear ruta | `app/community/new-route.tsx` | Alta de ruta por paradas/coordenadas (sin mapa), genera el trazado |
| Navegación | `app/(tabs)/_layout.tsx`, `app/_layout.tsx` | Nueva pestaña + rutas de stack |

**El detalle conecta todo el backend de la fase:**
- **Unirse/pagar** (1.2/1.5): gratis → alta directa; de pago → Checkout (abre URL de Stripe).
- **Gestor** (1.5): "Conectar Stripe" (onboarding Connect).
- **Rutas** (1.3): lista para miembros activos/gestores; publicar/archivar.
- **Gasolineras por octanaje** (1.1/1.4): muestra la más barata cerca de cada ruta según `fuelPref`.
- **Aviso en directo** (1.7): el gestor envía un aviso push por ruta.

El gestor puede **crear rutas sin mapa** (entrada manual de paradas con
coordenadas); el trazado se genera uniéndolas y la distancia se calcula sola.

> Nota: en modo local (sin Supabase) las listas salen vacías pero la UI renderiza
> y navega correctamente. El **visor/editor con mapa** (dibujar arrastrando +
> capa de tráfico) sigue pendiente de la librería de mapa + token Mapbox; la
> creación por coordenadas es la alternativa funcional mientras tanto.

---

## Estado global de la Fase 1

| Hito | Código | Aplicado/Desplegado |
|---|---|---|
| 1.0 Cimientos (BD + RLS) | ✅ | ⬜ |
| 1.1 Perfiles (vehículo/combustible) | ✅ | ⬜ |
| 1.2 Comunidades + membresías | ✅ | ⬜ |
| 1.3 Rutas (dominio + backend) | ✅ | ⬜ |
| 1.4 Gasolineras MITECO | ✅ | ⬜ |
| 1.5 Stripe Connect + webhooks | ✅ | ⬜ |
| 1.6 Tráfico del proveedor | ✅ config | ⬜ |
| 1.7 Avisos push | ✅ | ⬜ |

**Todo el código de la Fase 1 está escrito.** Falta lo que depende de credenciales/infra:
conectar Supabase y aplicar migraciones, desplegar Edge Functions, token Mapbox +
librería de mapa para la UI, y claves de Stripe. El `tsc` automático sigue pendiente
por el shell del entorno.
