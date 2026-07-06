import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { JoinRouteModal } from '../../src/components/JoinRouteModal';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SmartImage } from '../../src/components/SmartImage';
import { useAuth } from '../../src/context/AuthContext';
import { useRoutes } from '../../src/context/RoutesContext';
import { vehicleLabel } from '../../src/data/vehicles';
import { formatDuration, formatEventDate } from '../../src/data/seed';
import { useChats } from '../../src/context/ChatsContext';
import { isOpenJoin, joinModeLabel } from '../../src/lib/joinAccess';
import { routeDifficultyLabel, routeVehicleModeIcon, routeVehicleModeLabel } from '../../src/lib/routeVehicles';
import { colors, radius, spacing } from '../../src/theme';

export default function RouteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    getRoute,
    meetups,
    getSignupsForRoute,
    getPendingRequestsForRoute,
    getUserPendingRequest,
    isUserSignedUp,
    joinRoute,
    leaveRoute,
    requestJoinRoute,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
  } = useRoutes();
  const { getChatForRoute } = useChats();
  const [joinOpen, setJoinOpen] = useState(false);

  const route = id ? getRoute(id) : undefined;
  const attendees = route ? getSignupsForRoute(route.id) : [];
  const pendingRequests = route ? getPendingRequestsForRoute(route.id) : [];
  const signedUp = user && route ? isUserSignedUp(route.id, user.email) : false;
  const pending = user && route ? getUserPendingRequest({ routeId: route.id }, user.email) : undefined;
  const isFull = route?.maxAttendees ? attendees.length >= route.maxAttendees : false;
  const isPrivate = route ? !isOpenJoin(route.joinMode) : false;
  const isCreator = user && route?.creatorEmail === user.email;
  const groupChat = route ? getChatForRoute(route.id) : undefined;
  const inChat =
    user && groupChat
      ? groupChat.participantEmails.some((e) => e.toLowerCase() === user.email.toLowerCase())
      : false;

  const relatedMeetups = useMemo(
    () => (route ? meetups.filter((m) => m.routeId === route.id) : []),
    [meetups, route],
  );

  if (!route) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Ruta no encontrada.</Text>
      </SafeAreaView>
    );
  }

  function joinButtonLabel() {
    if (!user) return 'Inicia sesión para apuntarte';
    if (signedUp) return 'Cancelar apunte';
    if (isPrivate && pending) return 'Cancelar solicitud';
    if (isPrivate) return isFull ? 'Ruta completa' : 'Solicitar unirse a la ruta';
    return isFull ? 'Ruta completa' : 'Apuntarme a la ruta';
  }

  function handleJoinPress() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (signedUp) {
      leaveRoute(route.id, user.email);
      return;
    }
    if (pending) {
      cancelJoinRequest(pending.id, user.email);
      return;
    }
    setJoinOpen(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {route.coverImage ? (
          <SmartImage uri={route.coverImage} style={styles.cover} fallbackIcon="🗺️" />
        ) : null}

        {signedUp ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>✓ Estás apuntado a esta ruta</Text>
          </View>
        ) : pending ? (
          <View style={[styles.statusBanner, styles.statusBannerPending]}>
            <Text style={styles.statusBannerText}>Solicitud de acceso pendiente de aprobación</Text>
          </View>
        ) : null}

        <ScreenHero
          kicker={`${route.region} · ${route.province}`}
          title={route.title}
          subtitle={route.description}
          pills={[
            route.meetingAt ? joinModeLabel(route.joinMode) : null,
            `${routeVehicleModeIcon(route.vehicleMode)} ${routeVehicleModeLabel(route.vehicleMode)}`,
          ]}
        />
        {route.creatorName ? (
          <Text
            style={[styles.creator, route.creatorEmail && styles.creatorLink]}
            onPress={
              route.creatorEmail
                ? () => router.push(`/user/${encodeURIComponent(route.creatorEmail!)}`)
                : undefined
            }
          >
            Organiza: {route.creatorName}
          </Text>
        ) : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{route.distanceKm} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(route.durationMin)}</Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{routeDifficultyLabel(route.difficulty)}</Text>
            <Text style={styles.statLabel}>Nivel</Text>
          </View>
        </View>

        {route.meetingAt ? (
          <View style={styles.meetingCard}>
            <Text style={styles.section}>Quedada</Text>
            <Text style={styles.meetingText}>{formatEventDate(route.meetingAt)}</Text>
            {route.meetingPoint ? (
              <Text style={styles.meetingSub}>{route.meetingPoint}</Text>
            ) : null}
            <Text style={styles.meetingSub}>
              {attendees.length}
              {route.maxAttendees ? ` / ${route.maxAttendees}` : ''} apuntados
            </Text>
            <View style={styles.meetingNav}>
              <ActionButton
                label="📍 Ir a la quedada"
                onPress={() => openMeetingPoint(route, 'google')}
              />
              <ActionButton
                label="Waze"
                variant="secondary"
                onPress={() => openMeetingPoint(route, 'waze')}
              />
            </View>
          </View>
        ) : null}

        {relatedMeetups.length > 0 ? (
          <>
            <Text style={styles.section}>Quedadas en esta ruta</Text>
            {relatedMeetups.map((meetup) => (
              <Pressable
                key={meetup.id}
                style={styles.meetupLink}
                onPress={() => router.push(`/meetup/${meetup.id}`)}
              >
                <Text style={styles.meetupTitle}>{meetup.title}</Text>
                <Text style={styles.meetupMeta}>{formatEventDate(meetup.meetingAt)}</Text>
                <Text style={styles.meetupHint}>Ver quedada →</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Text style={styles.section}>Paradas</Text>
        {route.stops.map((stop, index) => (
          <View key={stop.id} style={styles.stop}>
            <Text style={styles.stopIndex}>{index + 1}</Text>
            <View style={styles.stopBody}>
              <Text style={styles.stopName}>{stop.name}</Text>
            </View>
          </View>
        ))}

        <ActionButton label="Abrir en mapas" onPress={() => openInMaps(route.stops)} />

        <ActionButton
          label={joinButtonLabel()}
          variant={signedUp ? 'secondary' : 'primary'}
          onPress={handleJoinPress}
          disabled={!!user && !signedUp && !pending && isFull}
        />

        {signedUp ? (
          <ActionButton
            label="🗺️ Conducir en grupo"
            onPress={() => router.push('/(tabs)/drive')}
          />
        ) : null}

        {inChat && groupChat ? (
          <ActionButton
            label="💬 Abrir chat del grupo"
            variant="secondary"
            onPress={() => router.push(`/chat/${groupChat.id}`)}
          />
        ) : null}

        {isCreator && pendingRequests.length > 0 ? (
          <>
            <Text style={styles.section}>Solicitudes pendientes ({pendingRequests.length})</Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <View style={styles.requestBody}>
                  <Text style={styles.attendeeName}>{request.userName}</Text>
                  <Text style={styles.attendeeVehicle}>
                    {vehicleLabel(request.vehicleType)} · {request.vehicleLabel}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <ActionButton
                    label="Aceptar"
                    onPress={() => approveJoinRequest(request.id, user!.email)}
                    style={styles.requestBtn}
                  />
                  <ActionButton
                    label="Rechazar"
                    variant="secondary"
                    onPress={() => rejectJoinRequest(request.id, user!.email)}
                    style={styles.requestBtn}
                  />
                </View>
              </View>
            ))}
          </>
        ) : null}

        {attendees.length > 0 ? (
          <>
            <Text style={styles.section}>Conductores apuntados</Text>
            {attendees.map((signup) => (
              <Pressable
                key={signup.id}
                style={({ pressed }) => [styles.attendee, pressed && styles.attendeePressed]}
                onPress={() => router.push(`/user/${encodeURIComponent(signup.userEmail)}`)}
              >
                <Text style={styles.attendeeName}>{signup.userName}</Text>
                <Text style={styles.attendeeVehicle}>
                  {vehicleLabel(signup.vehicleType)} · {signup.vehicleLabel}
                </Text>
                <Text style={styles.attendeeHint}>Ver perfil →</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>

      <JoinRouteModal
        visible={joinOpen}
        routeTitle={route.title}
        vehicleMode={route.vehicleMode}
        vehicles={user?.vehicles ?? []}
        confirmLabel={isPrivate ? 'Enviar solicitud' : 'Confirmar apunte'}
        onClose={() => setJoinOpen(false)}
        onManageVehicles={() => {
          setJoinOpen(false);
          router.push('/(tabs)/profile');
        }}
        onConfirm={(vehicle) => {
          if (!user) return;
          if (isPrivate) {
            requestJoinRoute(route.id, { email: user.email, name: user.name }, {
              type: vehicle.type,
              label: vehicle.label,
            });
          } else {
            joinRoute(route.id, { email: user.email, name: user.name }, {
              type: vehicle.type,
              label: vehicle.label,
            });
          }
          setJoinOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function openInMaps(stops: { latitude: number; longitude: number }[]) {
  if (!stops.length) return;
  const last = stops[stops.length - 1];
  const url = `https://www.google.com/maps/dir/?api=1&destination=${last.latitude},${last.longitude}&travelmode=driving`;
  void Linking.openURL(url);
}

function openMeetingPoint(
  route: { meetingLat?: number; meetingLng?: number; stops: { latitude: number; longitude: number }[] },
  provider: 'google' | 'waze',
) {
  const lat = route.meetingLat ?? route.stops[0]?.latitude;
  const lng = route.meetingLng ?? route.stops[0]?.longitude;
  if (lat == null || lng == null) return;
  const url =
    provider === 'waze'
      ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  void Linking.openURL(url);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 240,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  statusBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
  },
  statusBannerPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusBannerText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  error: { color: colors.danger, padding: spacing.md },
  creator: { color: colors.textMuted, fontSize: 13 },
  creatorLink: { color: colors.accent, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: colors.text, fontWeight: '700', fontSize: 15, textTransform: 'capitalize' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  meetingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  section: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: spacing.sm },
  meetingText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meetingSub: { color: colors.textMuted, fontSize: 13 },
  meetingNav: { gap: spacing.sm, marginTop: spacing.sm },
  meetupLink: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  meetupTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meetupMeta: { color: colors.textMuted, fontSize: 13 },
  meetupHint: { color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 2 },
  stop: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  stopIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '800',
  },
  stopBody: { flex: 1 },
  stopName: { color: colors.text, fontWeight: '600' },
  attendee: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  attendeePressed: { opacity: 0.7, borderColor: colors.accent },
  attendeeName: { color: colors.text, fontWeight: '700' },
  attendeeVehicle: { color: colors.textMuted, fontSize: 13 },
  attendeeHint: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 2 },
  requestRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  requestBody: { gap: 2 },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  requestBtn: { flex: 1 },
});
