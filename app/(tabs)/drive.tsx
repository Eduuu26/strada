import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { FuelStationsPanel } from '../../src/components/FuelStationsPanel';
import { MapboxDriveMap } from '../../src/components/MapboxDriveMap';
import { RouteCard } from '../../src/components/RouteCard';
import { ScreenHero } from '../../src/components/ScreenHero';
import { useAuth } from '../../src/context/AuthContext';
import { useRoutes } from '../../src/context/RoutesContext';
import { timeAgo } from '../../src/data/feedSeed';
import { vehicleLabel } from '../../src/data/vehicles';
import { useFuelStationsNearStops } from '../../src/hooks/useFuelStationsNearStops';
import { useGroupLocationShare } from '../../src/hooks/useGroupLocationShare';
import { isBackendConfigured, isMapsConfigured } from '../../src/lib/env';
import { fuelPreferenceLabel } from '../../src/lib/preferences';
import { openInMaps } from '../../src/lib/navigation';
import { colors, radius, spacing } from '../../src/theme';

const STALE_MS = 2 * 60 * 1000;

function isLocationStale(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > STALE_MS;
}

export default function DriveScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { routes, signups, getSignupsForRoute } = useRoutes();
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [shareHintDismissed, setShareHintDismissed] = useState(false);

  const myRouteOptions = useMemo(() => {
    if (!user) return [];
    const ids = new Set<string>();
    const list: typeof routes = [];
    for (const signup of signups) {
      if (signup.userEmail.toLowerCase() !== user.email.toLowerCase()) continue;
      if (!signup.routeId || ids.has(signup.routeId)) continue;
      const route = routes.find((r) => r.id === signup.routeId);
      if (route) {
        ids.add(route.id);
        list.push(route);
      }
    }
    return list;
  }, [routes, signups, user]);

  const defaultRoute =
    myRouteOptions[0] ??
    routes.find((r) => r.id === 'sierra-madrid') ??
    routes[0];

  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined);
  const activeRoute =
    routes.find((r) => r.id === (selectedRouteId ?? defaultRoute?.id)) ?? defaultRoute;

  const mySignup =
    user && activeRoute
      ? signups.find((s) => s.routeId === activeRoute.id && s.userEmail === user.email)
      : undefined;

  const fuelKey = user?.fuelPref;
  const { stations, loading: fuelLoading, cheapest } = useFuelStationsNearStops(
    activeRoute?.stops,
    fuelKey,
  );

  const { locations, status, errorMessage, retry } = useGroupLocationShare(
    activeRoute?.id,
    user ? { email: user.email, name: user.name } : undefined,
    sharingEnabled,
  );

  if (!activeRoute) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="🚗"
          title="Sin ruta activa"
          message="Apúntate a una ruta o quedada para empezar a conducir en grupo."
          actionLabel="Ver rutas"
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  const groupSignups = getSignupsForRoute(activeRoute.id);
  const sharingLocations = locations;
  const signupsWithoutGps = groupSignups.filter(
    (s) => !sharingLocations.some((l) => l.userEmail.toLowerCase() === s.userEmail.toLowerCase()),
  );

  const showShareHint =
    !!mySignup && !!user && !sharingEnabled && !shareHintDismissed && status === 'off';

  function groupStatusLabel(): string {
    if (status === 'active') return '· ubicación activa';
    if (status === 'pending') return '· obteniendo GPS…';
    if (status === 'denied') return '· permiso denegado';
    if (status === 'error') return '· no disponible';
    return '';
  }

  const extraMarkers = locations.map((l) => ({
    latitude: l.latitude,
    longitude: l.longitude,
    label: l.userName,
  }));

  const fuelSubtitle = fuelKey
    ? `Gasolineras con ${fuelPreferenceLabel(fuelKey).toLowerCase()} en el mapa (puntos verdes/naranjas).`
    : 'Configura tu combustible en Perfil para ver gasolineras filtradas en el mapa.';

  const routeMeta = mySignup ? 'Tu ruta activa' : user ? 'Ruta de ejemplo' : 'Ruta destacada';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.mapSection}>
        <MapboxDriveMap
          route={activeRoute}
          traffic
          extraMarkers={extraMarkers}
          fuelStations={fuelKey ? stations : []}
          cheapestStationId={cheapest?.id}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Navegación"
          title="Conducir"
          subtitle={
            isMapsConfigured()
              ? `Mapa interactivo Mapbox con tráfico. ${fuelSubtitle}`
              : `Mapa interactivo de la ruta. ${fuelSubtitle}`
          }
        />

        {myRouteOptions.length > 1 ? (
          <View style={styles.routePicker}>
            <Text style={styles.routePickerLabel}>Ruta activa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {myRouteOptions.map((route) => {
                const active = route.id === activeRoute?.id;
                return (
                  <Pressable
                    key={route.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedRouteId(route.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                      {route.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {fuelKey ? (
          <FuelStationsPanel
            fuelKey={fuelKey}
            stations={stations}
            loading={fuelLoading}
            cheapestId={cheapest?.id}
          />
        ) : user ? (
          <View style={styles.fuelHint}>
            <Text style={styles.fuelHintText}>
              ⛽ Elige tu combustible en Perfil para filtrar gasolineras en el mapa.
            </Text>
            <ActionButton
              label="Ir a preferencias"
              variant="secondary"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        ) : null}

        {!isBackendConfigured() && fuelKey ? (
          <Text style={styles.fuelHintText}>
            Conecta el servidor backend para ver precios reales de gasolineras.
          </Text>
        ) : null}

        <RouteCard
          title={activeRoute.title}
          subtitle={`${activeRoute.distanceKm} km · ${activeRoute.stops.length} paradas`}
          coverImage={activeRoute.coverImage}
          creatorName={activeRoute.creatorName}
          meta={routeMeta}
          tags={[activeRoute.region, activeRoute.difficulty]}
          statusLabel={mySignup ? 'Apuntado ✓' : undefined}
          onPress={() => router.push(`/route/${activeRoute.id}`)}
        />

        {!mySignup && user ? (
          <Text style={styles.fuelHintText}>
            Apúntate a una ruta para que el grupo vea tu posición en el mapa de esa ruta.
          </Text>
        ) : null}

        {showShareHint ? (
          <View style={styles.shareHint}>
            <Text style={styles.shareHintTitle}>Estás apuntado a esta ruta</Text>
            <Text style={styles.shareHintText}>
              Comparte tu ubicación para que el grupo te vea en el mapa mientras conduces.
            </Text>
            <ActionButton
              label="Compartir ubicación ahora"
              onPress={() => setSharingEnabled(true)}
            />
            <ActionButton
              label="Ahora no"
              variant="secondary"
              onPress={() => setShareHintDismissed(true)}
            />
          </View>
        ) : null}

        <ActionButton label="Abrir en Waze / Maps" onPress={() => openInMaps(activeRoute.stops)} />

        {!user ? (
          <Text style={styles.fuelHintText}>
            Inicia sesión para compartir tu ubicación en tiempo real con el grupo.
          </Text>
        ) : null}

        <ActionButton
          label={sharingEnabled ? 'Dejar de compartir ubicación' : 'Compartir ubicación (grupo)'}
          variant={sharingEnabled ? 'secondary' : 'primary'}
          onPress={() => {
            if (!user) {
              router.push('/login');
              return;
            }
            setSharingEnabled((v) => !v);
          }}
        />

        {sharingEnabled ? (
          <View style={styles.groupPanel}>
            <Text style={styles.groupTitle}>Grupo en ruta {groupStatusLabel()}</Text>

            {errorMessage ? <Text style={styles.groupError}>{errorMessage}</Text> : null}

            {status === 'denied' || status === 'error' ? (
              <ActionButton
                label="Reintentar GPS"
                variant="secondary"
                onPress={() => void retry()}
              />
            ) : null}

            {sharingLocations.length ? (
              sharingLocations.map((loc) => {
                const stale = isLocationStale(loc.updatedAt);
                return (
                  <Text
                    key={loc.userEmail}
                    style={[styles.groupItem, stale && styles.groupItemStale]}
                  >
                    📍 {loc.userName}
                    {loc.userEmail.toLowerCase() === user?.email.toLowerCase() ? ' (tú)' : ''}
                    {' · '}
                    {stale ? 'sin señal reciente' : timeAgo(loc.updatedAt)}
                  </Text>
                );
              })
            ) : status === 'pending' ? (
              <Text style={styles.groupItem}>Esperando tu primera posición GPS…</Text>
            ) : null}

            {sharingLocations.length > 0 && signupsWithoutGps.length > 0 ? (
              <Text style={styles.groupSubhead}>Apuntados sin GPS activo</Text>
            ) : null}

            {signupsWithoutGps.length ? (
              signupsWithoutGps.map((signup) => (
                <Text key={signup.id} style={styles.groupItemMuted}>
                  · {signup.userName} — {vehicleLabel(signup.vehicleType)} {signup.vehicleLabel}
                </Text>
              ))
            ) : sharingLocations.length ? null : status === 'active' ? (
              <Text style={styles.groupItem}>Solo tú compartes ubicación por ahora.</Text>
            ) : !errorMessage && status !== 'pending' ? (
              <Text style={styles.groupItem}>
                Nadie compartiendo aún. Invita al grupo desde la ruta.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  mapSection: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  fuelHint: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  shareHint: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.sm,
  },
  shareHintTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  shareHintText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  fuelHintText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  groupPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  groupTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  groupSubhead: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  groupError: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  groupItem: { color: colors.textMuted, fontSize: 14 },
  groupItemStale: { opacity: 0.65, fontStyle: 'italic' },
  groupItemMuted: { color: colors.textMuted, fontSize: 13, opacity: 0.85 },
  routePicker: { gap: spacing.xs },
  routePickerLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  chipRow: { gap: spacing.sm },
  chip: {
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.text, fontWeight: '700' },
});
