import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { formatEventDate } from '../../src/data/seed';
import { joinModeShort } from '../../src/lib/joinAccess';
import { routeVehicleModeLabel } from '../../src/lib/routeVehicles';
import type { Meetup } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';

type TimeFilter = 'upcoming' | 'past';

function isPastMeetup(meetup: Meetup): boolean {
  return new Date(meetup.meetingAt).getTime() < Date.now();
}

function matchesQuery(
  meetup: Meetup,
  routeRegion: string | undefined,
  q: string,
): boolean {
  if (!q) return true;
  return (
    meetup.title.toLowerCase().includes(q) ||
    meetup.description.toLowerCase().includes(q) ||
    meetup.meetingPoint.toLowerCase().includes(q) ||
    meetup.creatorName.toLowerCase().includes(q) ||
    (routeRegion?.toLowerCase().includes(q) ?? false)
  );
}

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { meetups, getRoute, getSignupsForMeetup, isUserSignedUpToMeetup } = useRoutes();
  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');

  const q = query.trim().toLowerCase();

  const signedUp = useMemo(() => {
    if (!user) return [];
    return meetups.filter((m) => {
      const route = m.routeId ? getRoute(m.routeId) : undefined;
      return isUserSignedUpToMeetup(m.id, user.email) && matchesQuery(m, route?.region, q);
    });
  }, [meetups, user, isUserSignedUpToMeetup, getRoute, q]);

  const explore = useMemo(() => {
    return meetups.filter((m) => {
      const route = m.routeId ? getRoute(m.routeId) : undefined;
      if (!matchesQuery(m, route?.region, q)) return false;
      if (user && isUserSignedUpToMeetup(m.id, user.email)) return false;
      const past = isPastMeetup(m);
      return timeFilter === 'past' ? past : !past;
    });
  }, [meetups, getRoute, q, user, isUserSignedUpToMeetup, timeFilter]);

  function renderMeetup(meetup: Meetup, options?: { dimmed?: boolean; statusLabel?: string }) {
    const route = meetup.routeId ? getRoute(meetup.routeId) : undefined;
    const count = getSignupsForMeetup(meetup.id).length;
    const signedUp = user ? isUserSignedUpToMeetup(meetup.id, user.email) : false;
    const past = isPastMeetup(meetup);

    let statusLabel = options?.statusLabel;
    if (!statusLabel) {
      if (signedUp) statusLabel = 'Apuntado ✓';
      else if (!user) statusLabel = 'Inicia sesión para apuntarte';
      else if (past) statusLabel = 'Finalizada';
    }

    return (
      <View key={meetup.id} style={styles.eventBlock}>
        <RouteCard
          title={meetup.title}
          subtitle={meetup.description}
          meta={formatEventDate(meetup.meetingAt)}
          coverImage={meetup.coverImage ?? route?.coverImage}
          creatorName={meetup.creatorName}
          vehicleMode={meetup.vehicleMode ?? route?.vehicleMode}
          dimmed={options?.dimmed ?? past}
          statusLabel={statusLabel}
          tags={[
            joinModeShort(meetup.joinMode),
            meetup.meetingPoint,
            `${count}${meetup.maxAttendees ? `/${meetup.maxAttendees}` : ''} apuntados`,
            routeVehicleModeLabel(meetup.vehicleMode ?? route?.vehicleMode),
            route?.region,
          ].filter(Boolean) as string[]}
          onPress={() => router.push(`/meetup/${meetup.id}`)}
        />
      </View>
    );
  }

  const emptyTitle =
    timeFilter === 'past'
      ? q
        ? 'Sin resultados'
        : 'No hay quedadas pasadas'
      : q
        ? 'Sin resultados'
        : 'Aún no hay quedadas';

  const emptyMessage =
    timeFilter === 'past'
      ? q
        ? 'No hay quedadas pasadas que coincidan con tu búsqueda.'
        : 'Las quedadas finalizadas aparecerán aquí.'
      : q
        ? 'No hay quedadas que coincidan con tu búsqueda.'
        : 'Organiza la primera quedada y reúne a la comunidad en carretera.';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Comunidad"
          title="Quedadas"
          subtitle="Organiza o únete a salidas con fecha y punto de encuentro. Al apuntarte eliges tu vehículo del garaje."
        />

        {user ? (
          <ActionButton label="+ Organizar quedada" onPress={() => router.push('/create-meetup')} />
        ) : (
          <View style={styles.guestBox}>
            <Text style={styles.guestText}>
              Puedes ver las quedadas sin cuenta. Para organizar o apuntarte, inicia sesión.
            </Text>
            <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />
            <ActionButton
              label="Crear cuenta"
              variant="secondary"
              onPress={() => router.push('/register')}
            />
          </View>
        )}

        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar quedada, lugar o región…" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            style={[styles.chip, timeFilter === 'upcoming' && styles.chipActive]}
            onPress={() => setTimeFilter('upcoming')}
          >
            <Text style={[styles.chipText, timeFilter === 'upcoming' && styles.chipTextActive]}>Próximas</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, timeFilter === 'past' && styles.chipActive]}
            onPress={() => setTimeFilter('past')}
          >
            <Text style={[styles.chipText, timeFilter === 'past' && styles.chipTextActive]}>Pasadas</Text>
          </Pressable>
        </ScrollView>

        {user && signedUp.length > 0 ? (
          <>
            <SectionTitle>Apuntado ({signedUp.length})</SectionTitle>
            {signedUp.map((meetup) => renderMeetup(meetup, { statusLabel: 'Apuntado ✓' }))}
          </>
        ) : null}

        {explore.length > 0 ? (
          <>
            <SectionTitle>
              {timeFilter === 'past' ? 'Anteriores' : 'Explorar'} ({explore.length})
            </SectionTitle>
            {explore.map((meetup) => renderMeetup(meetup))}
          </>
        ) : !signedUp.length ? (
          <EmptyState
            icon="📅"
            title={emptyTitle}
            message={emptyMessage}
            actionLabel={
              query || timeFilter === 'past'
                ? undefined
                : user
                  ? '+ Organizar quedada'
                  : 'Iniciar sesión'
            }
            onAction={
              query || timeFilter === 'past'
                ? undefined
                : user
                  ? () => router.push('/create-meetup')
                  : () => router.push('/login')
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  guestBox: { gap: spacing.sm },
  guestText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  eventBlock: { gap: spacing.sm },
  chipRow: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.accent, fontWeight: '700' },
});
