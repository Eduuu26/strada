import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { JoinRouteModal } from '../../src/components/JoinRouteModal';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SmartImage } from '../../src/components/SmartImage';
import { useAuth } from '../../src/context/AuthContext';
import { useRoutes } from '../../src/context/RoutesContext';
import { formatEventDate } from '../../src/data/seed';
import { vehicleLabel } from '../../src/data/vehicles';
import { isOpenJoin, joinModeLabel } from '../../src/lib/joinAccess';
import { routeDifficultyLabel, routeVehicleModeIcon, routeVehicleModeLabel } from '../../src/lib/routeVehicles';
import { useChats } from '../../src/context/ChatsContext';
import { colors, radius, spacing } from '../../src/theme';

function isPastMeetup(meetingAt: string): boolean {
  return new Date(meetingAt).getTime() < Date.now();
}

export default function MeetupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    getMeetup,
    getRoute,
    getSignupsForMeetup,
    getPendingRequestsForMeetup,
    getUserPendingRequest,
    isUserSignedUpToMeetup,
    joinMeetup,
    leaveMeetup,
    requestJoinMeetup,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
  } = useRoutes();
  const { getChatForMeetup } = useChats();
  const [joinOpen, setJoinOpen] = useState(false);

  const meetup = id ? getMeetup(id) : undefined;
  const route = meetup?.routeId ? getRoute(meetup.routeId) : undefined;
  const attendees = meetup ? getSignupsForMeetup(meetup.id) : [];
  const pendingRequests = meetup ? getPendingRequestsForMeetup(meetup.id) : [];
  const signedUp = user && meetup ? isUserSignedUpToMeetup(meetup.id, user.email) : false;
  const pending = user && meetup ? getUserPendingRequest({ meetupId: meetup.id }, user.email) : undefined;
  const isFull = meetup?.maxAttendees ? attendees.length >= meetup.maxAttendees : false;
  const mode = meetup?.vehicleMode ?? route?.vehicleMode ?? 'mixto';
  const isCreator = user && meetup?.creatorEmail === user.email;
  const isPrivate = meetup ? !isOpenJoin(meetup.joinMode) : false;
  const groupChat = meetup ? getChatForMeetup(meetup.id) : undefined;
  const inChat =
    user && groupChat
      ? groupChat.participantEmails.some((e) => e.toLowerCase() === user.email.toLowerCase())
      : false;
  const past = isPastMeetup(meetup?.meetingAt ?? '');
  const coverImage = meetup?.coverImage ?? route?.coverImage;

  if (!meetup) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Quedada no encontrada.</Text>
      </SafeAreaView>
    );
  }

  async function openNav(provider: 'google' | 'waze') {
    const lat = meetup.meetingLat ?? route?.stops?.[0]?.latitude;
    const lng = meetup.meetingLng ?? route?.stops?.[0]?.longitude;
    if (lat == null || lng == null) return;
    const url =
      provider === 'waze'
        ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    await Linking.openURL(url);
  }

  function joinButtonLabel() {
    if (!user) return 'Inicia sesión para apuntarte';
    if (signedUp) return 'Cancelar apunte';
    if (isPrivate && pending) return 'Cancelar solicitud';
    if (isPrivate) return isFull ? 'Quedada completa' : 'Solicitar unirse — elegir vehículo';
    return isFull ? 'Quedada completa' : 'Apuntarme — elegir vehículo';
  }

  function handleJoinPress() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (signedUp) {
      leaveMeetup(meetup.id, user.email);
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
        {coverImage ? (
          <SmartImage uri={coverImage} style={styles.cover} fallbackIcon="📅" />
        ) : null}

        {signedUp ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>✓ Estás apuntado a esta quedada</Text>
          </View>
        ) : pending ? (
          <View style={[styles.statusBanner, styles.statusBannerPending]}>
            <Text style={styles.statusBannerText}>Solicitud pendiente de aprobación</Text>
          </View>
        ) : past ? (
          <View style={[styles.statusBanner, styles.statusBannerPast]}>
            <Text style={styles.statusBannerText}>Esta quedada ya finalizó</Text>
          </View>
        ) : null}

        <ScreenHero
          kicker="Quedada"
          title={meetup.title}
          subtitle={meetup.description}
          pills={[
            joinModeLabel(meetup.joinMode),
            `${routeVehicleModeIcon(mode)} ${routeVehicleModeLabel(mode)}`,
          ]}
        />
        {meetup.creatorName ? (
          <Text
            style={[styles.creator, meetup.creatorEmail && styles.creatorLink]}
            onPress={
              meetup.creatorEmail
                ? () => router.push(`/user/${encodeURIComponent(meetup.creatorEmail!)}`)
                : undefined
            }
          >
            Organiza: {meetup.creatorName}
          </Text>
        ) : null}

        <View style={styles.meetingCard}>
          <Text style={styles.section}>Encuentro</Text>
          <Text style={styles.meetingText}>{formatEventDate(meetup.meetingAt)}</Text>
          <Text style={styles.meetingText}>📍 {meetup.meetingPoint}</Text>
          <Text style={styles.meetingText}>
            👥 {attendees.length} / {meetup.maxAttendees ?? '∞'} plazas
          </Text>
          <View style={styles.navRow}>
            <ActionButton label="📍 Ir a la quedada" onPress={() => openNav('google')} />
            <ActionButton label="Waze" variant="secondary" onPress={() => openNav('waze')} />
          </View>
        </View>

        {route ? (
          <View style={styles.linkedCard}>
            <Text style={styles.section}>Ruta vinculada</Text>
            <Text style={styles.linkedTitle}>{route.title}</Text>
            <Text style={styles.linkedMeta}>
              {route.region} · {route.distanceKm} km · {routeDifficultyLabel(route.difficulty)}
            </Text>
            <ActionButton label="Ver ruta completa" variant="secondary" onPress={() => router.push(`/route/${route.id}`)} />
          </View>
        ) : null}

        <ActionButton
          label={joinButtonLabel()}
          variant={signedUp ? 'secondary' : 'primary'}
          onPress={handleJoinPress}
          disabled={!!user && !signedUp && !pending && (isFull || past)}
        />

        {signedUp && route ? (
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

        <Text style={styles.section}>Apuntados ({attendees.length})</Text>
        {attendees.length ? (
          attendees.map((signup) => (
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
          ))
        ) : (
          <Text style={styles.empty}>Sé el primero en apuntarte</Text>
        )}
      </ScrollView>

      {user ? (
        <JoinRouteModal
          visible={joinOpen}
          routeTitle={meetup.title}
          vehicleMode={mode}
          vehicles={user.vehicles}
          confirmLabel={isPrivate ? 'Enviar solicitud' : 'Confirmar apunte'}
          onClose={() => setJoinOpen(false)}
          onConfirm={(vehicle) => {
            if (isPrivate) {
              requestJoinMeetup(meetup.id, { email: user.email, name: user.name }, vehicle);
            } else {
              joinMeetup(meetup.id, { email: user.email, name: user.name }, vehicle);
            }
            setJoinOpen(false);
          }}
          onManageVehicles={() => {
            setJoinOpen(false);
            router.push('/(tabs)/profile');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 220,
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
  statusBannerPast: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.9,
  },
  statusBannerText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  creator: { color: colors.text, fontSize: 14, fontWeight: '600' },
  creatorLink: { color: colors.accent },
  meetingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  section: { color: colors.text, fontSize: 16, fontWeight: '800' },
  meetingText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  navRow: { gap: spacing.sm, marginTop: spacing.xs },
  linkedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  linkedTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  linkedMeta: { color: colors.textMuted, fontSize: 13 },
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
  empty: { color: colors.textMuted, fontSize: 14 },
  error: { color: colors.danger, padding: spacing.md },
});
