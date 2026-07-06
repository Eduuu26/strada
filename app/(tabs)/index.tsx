import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { RouteCard } from '../../src/components/RouteCard';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SearchBar } from '../../src/components/SearchBar';
import { SectionTitle } from '../../src/components/SectionTitle';
import { useAuth } from '../../src/context/AuthContext';
import { useRoutes } from '../../src/context/RoutesContext';
import type { RouteDifficulty, RouteVehicleMode } from '../../src/types';
import {
  ROUTE_DIFFICULTIES,
  ROUTE_VEHICLE_MODES,
  routeDifficultyLabel,
  routeVehicleModeLabel,
} from '../../src/lib/routeVehicles';
import { useCookieConsentInset } from '../../src/context/CookieConsentContext';
import { colors, radius, spacing } from '../../src/theme';

type VehicleFilter = 'all' | RouteVehicleMode;
type DifficultyFilter = 'all' | RouteDifficulty;

export default function RoutesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { routes, signups, isUserSignedUp } = useRoutes();
  const [query, setQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const cookieInset = useCookieConsentInset(spacing.xl);

  const q = query.trim().toLowerCase();

  const myCreated = useMemo(() => {
    if (!user) return [];
    const email = user.email.toLowerCase();
    return routes.filter((r) => r.creatorEmail?.toLowerCase() === email);
  }, [routes, user]);

  const mySignedUp = useMemo(() => {
    if (!user) return [];
    return routes.filter((r) => isUserSignedUp(r.id, user.email));
  }, [routes, user, isUserSignedUp]);

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      if (vehicleFilter !== 'all' && (r.vehicleMode ?? 'mixto') !== vehicleFilter) return false;
      if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.province.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.difficulty.toLowerCase().includes(q) ||
        routeDifficultyLabel(r.difficulty).toLowerCase().includes(q)
      );
    });
  }, [routes, q, vehicleFilter, difficultyFilter]);

  const explore = useMemo(() => {
    if (!user) return filtered;
    const signedIds = new Set(mySignedUp.map((r) => r.id));
    const createdIds = new Set(myCreated.map((r) => r.id));
    return filtered.filter((r) => !signedIds.has(r.id) && !createdIds.has(r.id));
  }, [filtered, user, mySignedUp, myCreated]);

  function RouteItem({
    route,
    statusLabel,
  }: {
    route: (typeof routes)[number];
    statusLabel?: string;
  }) {
    return (
      <RouteCard
        title={route.title}
        subtitle={route.description}
        coverImage={route.coverImage}
        creatorName={route.creatorName}
        meta={`${route.distanceKm} km`}
        vehicleMode={route.vehicleMode}
        statusLabel={statusLabel}
        tags={[route.region, routeDifficultyLabel(route.difficulty)]}
        onPress={() => router.push(`/route/${route.id}`)}
      />
    );
  }

  const hasFilters = !!(q || vehicleFilter !== 'all' || difficultyFilter !== 'all');

  function clearFilters() {
    setQuery('');
    setVehicleFilter('all');
    setDifficultyFilter('all');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: cookieInset }]}>
        <ScreenHero
          kicker="España"
          title="Rutas de la comunidad"
          subtitle="Rutas publicadas por conductores y motoristas, con foto y descripción de la experiencia."
        />

        {user ? (
          <Link href="/create-route" asChild>
            <ActionButton label="+ Publicar ruta" />
          </Link>
        ) : (
          <Pressable onPress={() => router.push('/login')}>
            <View style={styles.guestCreate}>
              <Text style={styles.guestCreateText}>Inicia sesión para publicar tu ruta</Text>
            </View>
          </Pressable>
        )}

        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nombre, región o nivel…" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            style={[styles.chip, vehicleFilter === 'all' && styles.chipActive]}
            onPress={() => setVehicleFilter('all')}
          >
            <Text style={[styles.chipText, vehicleFilter === 'all' && styles.chipTextActive]}>Todos</Text>
          </Pressable>
          {ROUTE_VEHICLE_MODES.map((mode) => (
            <Pressable
              key={mode.id}
              style={[styles.chip, vehicleFilter === mode.id && styles.chipActive]}
              onPress={() => setVehicleFilter(mode.id)}
            >
              <Text style={[styles.chipText, vehicleFilter === mode.id && styles.chipTextActive]}>
                {mode.icon} {routeVehicleModeLabel(mode.id)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {ROUTE_DIFFICULTIES.map((option) => {
            const active = difficultyFilter === option.id;
            return (
              <Pressable
                key={option.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDifficultyFilter(option.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {user && mySignedUp.length > 0 ? (
          <>
            <SectionTitle>Apuntado ({mySignedUp.length})</SectionTitle>
            <View style={styles.list}>
              {mySignedUp.map((route) => (
                <RouteItem key={route.id} route={route} statusLabel="Apuntado ✓" />
              ))}
            </View>
          </>
        ) : null}

        {user && myCreated.length > 0 ? (
          <>
            <SectionTitle>Mis rutas ({myCreated.length})</SectionTitle>
            <View style={styles.list}>
              {myCreated.map((route) => (
                <RouteItem key={route.id} route={route} statusLabel="Creada por ti" />
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle>
          Explorar ({explore.length}
          {query || vehicleFilter !== 'all' || difficultyFilter !== 'all' ? ` de ${routes.length}` : ''})
        </SectionTitle>

        {explore.length ? (
          <View style={styles.list}>
            {explore.map((route) => (
              <RouteItem
                key={route.id}
                route={route}
                statusLabel={user ? undefined : 'Inicia sesión para apuntarte'}
              />
            ))}
          </View>
        ) : !mySignedUp.length && !myCreated.length ? (
          <EmptyState
            icon="🛣️"
            title={query ? 'Sin resultados' : 'Aún no hay rutas'}
            message={
              query
                ? 'Prueba con otro término o cambia los filtros.'
                : 'Sé el primero en publicar una ruta para la comunidad.'
            }
            actionLabel={query ? undefined : user ? '+ Publicar ruta' : 'Iniciar sesión'}
            onAction={
              query ? undefined : user ? () => router.push('/create-route') : () => router.push('/login')
            }
          />
        ) : (
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            message="No hay más rutas con estos filtros. Prueba otro término o restablece la búsqueda."
            actionLabel={hasFilters ? 'Limpiar filtros' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  list: { gap: spacing.md },
  chipRow: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.text, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  guestCreate: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  guestCreateText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
