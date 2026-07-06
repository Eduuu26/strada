import { useRouter } from 'expo-router';

import { useMemo, useState } from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../src/components/ActionButton';
import { ClubApprovalNotification, ClubRequestPendingBanner } from '../../src/components/ClubApprovalNotification';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SearchBar } from '../../src/components/SearchBar';

import { useAuth } from '../../src/context/AuthContext';

import { useClubs } from '../../src/context/ClubsContext';

import { ClubRankingPanel } from '../../src/components/ClubRankingPanel';
import { ClubSearchRadiusPicker } from '../../src/components/ClubSearchRadiusPicker';
import { LocationPermissionBanner } from '../../src/components/LocationPermissionBanner';
import { useClubSearchRadius } from '../../src/hooks/useClubSearchRadius';
import { useUserLocation } from '../../src/hooks/useUserLocation';

import { formatDistanceKm } from '../../src/lib/geo';
import { clubSearchEmptyMessage, clubSearchSectionTitle } from '../../src/lib/clubSearchRadius';

import { routeVehicleModeLabel } from '../../src/lib/routeVehicles';

import type { RouteVehicleMode } from '../../src/types';

import { colors, radius, spacing } from '../../src/theme';

type VehicleFilter = 'all' | RouteVehicleMode;

const VEHICLE_FILTERS: { id: VehicleFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'coches', label: 'Coches' },
  { id: 'motos', label: 'Motos' },
  { id: 'mixto', label: 'Mixto' },
];



export default function ClubsScreen() {

  const router = useRouter();

  const { user } = useAuth();

  const { getUserClubs, getPendingInvitationsFor, getNearbyClubs, getUserClubCreationRequests, getUnreadClubApprovalNotifications, markClubApprovalSeen, acceptInvitation, rejectInvitation } =
    useClubs();
  const myRequests = user ? getUserClubCreationRequests(user.email) : [];
  const { latitude, longitude, status, hint, requestLocation, refresh } = useUserLocation();
  const { radiusId, setRadiusId, maxKm } = useClubSearchRadius();
  const myClubs = user ? getUserClubs(user.email) : [];
  const pending = user ? getPendingInvitationsFor(user.email) : [];
  const nearbyClubs = getNearbyClubs(latitude, longitude, user?.email, maxKm);
  const pendingRequest = myRequests.find((r) => r.status === 'pending');
  const approvalNotifications = user ? getUnreadClubApprovalNotifications(user.email) : [];
  const [query, setQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');

  const matchesVehicle = (mode: RouteVehicleMode) =>
    vehicleFilter === 'all' || mode === vehicleFilter;

  const filteredNearby = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nearbyClubs.filter((c) => {
      if (!matchesVehicle(c.vehicleMode)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.locationLabel?.toLowerCase().includes(q) ?? false) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [nearbyClubs, query, vehicleFilter]);

  const filteredMyClubs = useMemo(() => {
    return myClubs.filter((c) => matchesVehicle(c.vehicleMode));
  }, [myClubs, vehicleFilter]);

  function ClubRow({
    name,
    meta,
    distance,
    onPress,
  }: {
    name: string;
    meta: string;
    distance?: string;
    onPress: () => void;
  }) {
    const initial = name.charAt(0).toUpperCase();
    return (
      <Pressable style={styles.clubCard} onPress={onPress}>
        <View style={styles.clubCardTop}>
          <View style={styles.clubAvatar}>
            <Text style={styles.clubAvatarText}>{initial}</Text>
          </View>
          <View style={styles.clubCardBody}>
            <View style={styles.clubTitleRow}>
              <Text style={styles.clubTitle}>{name}</Text>
              {distance ? <Text style={styles.distance}>{distance}</Text> : null}
            </View>
            <Text style={styles.clubMeta} numberOfLines={2}>
              {meta}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    );
  }

  return (

    <SafeAreaView style={styles.safe} edges={['bottom']}>

      <ScrollView contentContainerStyle={styles.content}>

        <ScreenHero

          kicker="Comunidad"

          title="Clubes"

          subtitle="Elige el perímetro de búsqueda. Por defecto se muestran clubes en toda España."

        />

        {!user ? (

          <View style={styles.guestBox}>

            <Text style={styles.guestText}>Inicia sesión para crear un club o aceptar invitaciones.</Text>

            <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />

          </View>

        ) : !pendingRequest ? (

          <ActionButton label="+ Solicitar club" onPress={() => router.push('/create-club')} />
        ) : null}

        {approvalNotifications.map((notification) => (
          <ClubApprovalNotification
            key={notification.id}
            notification={notification}
            onViewClub={(clubId) => {
              markClubApprovalSeen(notification.id, user!.email);
              router.push(`/club/${clubId}`);
            }}
            onDismiss={() => markClubApprovalSeen(notification.id, user!.email)}
          />
        ))}

        {user && pendingRequest ? (
          <ClubRequestPendingBanner clubName={pendingRequest.name} />
        ) : null}

        {user && pending.length > 0 ? (
          <>
            <Text style={styles.sectionHighlight}>
              Invitaciones pendientes ({pending.length})
            </Text>
            {pending.map((inv) => (
              <View key={inv.id} style={styles.inviteCard}>
                <Text style={styles.inviteTitle}>{inv.clubName}</Text>
                <Text style={styles.inviteMeta}>Te invita {inv.fromName}</Text>
                <View style={styles.inviteActions}>
                  <ActionButton
                    label="Aceptar"
                    onPress={() => acceptInvitation(inv.id, { email: user.email, name: user.name })}
                    style={styles.inviteBtn}
                  />
                  <ActionButton
                    label="Rechazar"
                    variant="secondary"
                    onPress={() => rejectInvitation(inv.id, { email: user.email, name: user.name })}
                    style={styles.inviteBtn}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {user ? (
          <>
            <Text style={styles.section}>Mis clubes</Text>
            {filteredMyClubs.length ? (
              filteredMyClubs.map((club) => (
                <ClubRow
                  key={club.id}
                  name={club.name}
                  distance={undefined}
                  meta={`${club.locationLabel ? `${club.locationLabel} · ` : ''}${club.memberEmails.length} miembros · ${routeVehicleModeLabel(club.vehicleMode)}`}
                  onPress={() => router.push(`/club/${club.id}`)}
                />
              ))
            ) : (
              <EmptyState
                icon="🏁"
                title="Sin clubes todavía"
                message="Crea tu propio club o acepta una invitación para empezar."
                actionLabel="+ Solicitar club"
                onAction={() => router.push('/create-club')}
              />
            )}
          </>
        ) : null}

        <ClubRankingPanel />

        <LocationPermissionBanner
          status={status}
          hint={hint}
          onRequest={requestLocation}
          onRefresh={status === 'ready' ? refresh : undefined}
        />

        <Text style={styles.section}>{clubSearchSectionTitle(radiusId)}</Text>

        <ClubSearchRadiusPicker value={radiusId} onChange={setRadiusId} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {VEHICLE_FILTERS.map((option) => {
            const active = vehicleFilter === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setVehicleFilter(option.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar club por nombre o ciudad…" />

        {status === 'loading' && !filteredNearby.length ? (

          <Text style={styles.empty}>Buscando clubes…</Text>

        ) : filteredNearby.length ? (

          filteredNearby.map((club) => (
            <ClubRow
              key={club.id}
              name={club.name}
              distance={formatDistanceKm(club.distanceKm)}
              meta={`${club.locationLabel ? `${club.locationLabel} · ` : ''}${club.memberEmails.length} miembros · ${routeVehicleModeLabel(club.vehicleMode)}`}
              onPress={() => router.push(`/club/${club.id}`)}
            />
          ))

        ) : (
          <EmptyState
            icon="🏁"
            title={query ? 'Sin resultados' : 'No hay clubes cerca'}
            message={query ? 'Prueba otro nombre o amplía el radio de búsqueda.' : clubSearchEmptyMessage(radiusId)}
            actionLabel={!query && user ? '+ Solicitar club' : undefined}
            onAction={!query && user ? () => router.push('/create-club') : undefined}
          />
        )}



      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: colors.background },

  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },

  guestBox: { gap: spacing.sm },

  guestText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  pendingRequestBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pendingRequestTitle: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  pendingRequestText: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },

  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  sectionHighlight: { color: colors.accent, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
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

  inviteCard: {

    backgroundColor: colors.surface,

    borderRadius: radius.md,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    gap: spacing.sm,

  },

  inviteTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },

  inviteMeta: { color: colors.textMuted, fontSize: 13 },

  inviteActions: { flexDirection: 'row', gap: spacing.sm },

  inviteBtn: { flex: 1 },

  clubCard: {

    backgroundColor: colors.surface,

    borderRadius: radius.md,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

  },

  clubCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clubAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  clubCardBody: { flex: 1, gap: 2 },
  clubTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },

  clubTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  chevron: { color: colors.textMuted, fontSize: 22, fontWeight: '300' },

  distance: { color: colors.accent, fontSize: 13, fontWeight: '700' },

  clubMeta: { color: colors.textMuted, fontSize: 13 },

  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },

});


