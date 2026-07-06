import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClubMembersGallery } from '../../src/components/ClubMembersGallery';
import { ActionButton } from '../../src/components/ActionButton';
import { ScreenHero } from '../../src/components/ScreenHero';
import { useAuth } from '../../src/context/AuthContext';
import { useChats } from '../../src/context/ChatsContext';
import { useClubs } from '../../src/context/ClubsContext';
import { useRoutes } from '../../src/context/RoutesContext';
import { formatEventDate } from '../../src/data/seed';
import { isClubCreator, isClubMember } from '../../src/lib/clubs';
import { formatRankingStat, getClubRankPosition } from '../../src/lib/clubRanking';
import { distanceKm, formatDistanceKm } from '../../src/lib/geo';
import { useUserLocation } from '../../src/hooks/useUserLocation';
import { routeVehicleModeIcon, routeVehicleModeLabel } from '../../src/lib/routeVehicles';
import { colors, radius, spacing } from '../../src/theme';

export default function ClubDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getUserProfileByEmail } = useAuth();
  const { getClub, getSentInvitationsForClub, sendInvitation, deleteClub, clubs, invitations } = useClubs();
  const { routes, meetups, signups } = useRoutes();
  const { chats, ensureClubChat } = useChats();
  const { latitude, longitude } = useUserLocation();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteOk, setInviteOk] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const club = id ? getClub(id) : undefined;

  const memberEmails = useMemo(
    () => new Set((club?.memberEmails ?? []).map((e) => e.toLowerCase())),
    [club?.memberEmails],
  );

  const clubMeetups = useMemo(() => {
    const now = Date.now();
    return meetups
      .filter((m) => memberEmails.has(m.creatorEmail?.toLowerCase() ?? ''))
      .filter((m) => new Date(m.meetingAt).getTime() >= now)
      .slice(0, 5);
  }, [meetups, memberEmails]);

  const clubRoutes = useMemo(() => {
    return routes
      .filter((r) => memberEmails.has(r.creatorEmail?.toLowerCase() ?? ''))
      .slice(0, 4);
  }, [routes, memberEmails]);

  if (!club) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Club no encontrado.</Text>
      </SafeAreaView>
    );
  }

  const isCreator = user ? isClubCreator(club, user.email) : false;
  const isMember = user ? isClubMember(club, user.email) : false;
  const sentInvites = getSentInvitationsForClub(club.id);
  const memberProfiles = club.memberEmails.map(
    (email) => getUserProfileByEmail(email) ?? { email, name: email, vehicles: [] },
  );
  const distanceLabel =
    club.latitude != null && club.longitude != null
      ? formatDistanceKm(distanceKm({ latitude, longitude }, { latitude: club.latitude, longitude: club.longitude }))
      : null;
  const rankInfo = getClubRankPosition(club.id, {
    clubs,
    routes,
    meetups,
    signups,
    invitations,
    chats,
  });

  function handleInvite() {
    if (!user) {
      router.push('/login');
      return;
    }
    setInviteError('');
    setInviteOk('');
    const result = sendInvitation(club.id, { email: user.email, name: user.name }, inviteEmail);
    if (!result.ok) {
      setInviteError(result.error);
      return;
    }
    setInviteEmail('');
    setInviteOk('Invitación enviada correctamente.');
  }

  function handleDeletePress() {
    setConfirmDelete(true);
  }

  function handleDeleteConfirm() {
    if (!user || !club) return;
    if (deleteClub(club.id, user.email)) {
      router.replace('/(tabs)/clubs');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Club"
          title={club.name}
          subtitle={club.description}
          pills={[
            `${routeVehicleModeIcon(club.vehicleMode)} ${routeVehicleModeLabel(club.vehicleMode)}`,
            club.locationLabel
              ? `📍 ${club.locationLabel}${distanceLabel ? ` · ${distanceLabel}` : ''}`
              : null,
          ]}
        />
        <Text
          style={[styles.creator, styles.creatorLink]}
          onPress={() => router.push(`/user/${encodeURIComponent(club.creatorEmail)}`)}
        >
          Creado por {club.creatorName}
        </Text>

        {rankInfo ? (
          <View style={styles.rankBox}>
            <Text style={styles.rankTitle}>
              #{rankInfo.rank} en el ranking general · {rankInfo.total} clubes
            </Text>
            <Text style={styles.rankMeta}>{formatRankingStat(rankInfo.stats, 'overall')}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{club.memberEmails.length}</Text>
            <Text style={styles.statLabel}>Miembros</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{clubMeetups.length}</Text>
            <Text style={styles.statLabel}>Quedadas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{clubRoutes.length}</Text>
            <Text style={styles.statLabel}>Rutas</Text>
          </View>
        </View>

        {clubMeetups.length > 0 ? (
          <>
            <Text style={styles.section}>Próximas quedadas del club</Text>
            {clubMeetups.map((meetup) => (
              <Pressable
                key={meetup.id}
                style={styles.linkCard}
                onPress={() => router.push(`/meetup/${meetup.id}`)}
              >
                <Text style={styles.linkTitle}>{meetup.title}</Text>
                <Text style={styles.linkMeta}>{formatEventDate(meetup.meetingAt)}</Text>
                <Text style={styles.linkHint}>Ver quedada →</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {clubRoutes.length > 0 ? (
          <>
            <Text style={styles.section}>Rutas de miembros</Text>
            {clubRoutes.map((route) => (
              <Pressable
                key={route.id}
                style={styles.linkCard}
                onPress={() => router.push(`/route/${route.id}`)}
              >
                <Text style={styles.linkTitle}>{route.title}</Text>
                <Text style={styles.linkMeta}>
                  {route.region} · {route.distanceKm} km
                </Text>
                <Text style={styles.linkHint}>Ver ruta →</Text>
              </Pressable>
            ))}
          </>
        ) : null}

        <Text style={styles.section}>Participantes ({club.memberEmails.length})</Text>
        <ClubMembersGallery
          members={memberProfiles}
          creatorEmail={club.creatorEmail}
          vehicleMode={club.vehicleMode}
          onPressMember={(email) => router.push(`/user/${encodeURIComponent(email)}`)}
        />

        {isMember ? (
          <>
            <ActionButton
              label="Abrir chat del club"
              onPress={() => {
                const chat = ensureClubChat(club);
                router.push(`/chat/${chat.id}`);
              }}
            />
            <ActionButton
              label="+ Organizar quedada"
              variant="secondary"
              onPress={() => router.push('/create-meetup')}
            />
          </>
        ) : null}

        {isCreator ? (
          <>
            <Text style={styles.section}>Invitar usuario</Text>
            <Text style={styles.hint}>Envía una invitación por correo a otro usuario de Strada.</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {inviteError ? <Text style={styles.error}>{inviteError}</Text> : null}
            {inviteOk ? <Text style={styles.ok}>{inviteOk}</Text> : null}
            <ActionButton label="Enviar invitación" onPress={handleInvite} />

            {sentInvites.length ? (
              <>
                <Text style={styles.section}>Invitaciones enviadas</Text>
                {sentInvites.map((inv) => (
                  <View key={inv.id} style={styles.inviteRow}>
                    <Text style={styles.memberName}>{inv.toEmail}</Text>
                    <Text style={styles.inviteStatus}>
                      {inv.status === 'pending' ? 'Pendiente' : inv.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            <View style={styles.dangerZone}>
              {!confirmDelete ? (
                <ActionButton label="Eliminar club" variant="secondary" onPress={handleDeletePress} />
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>¿Seguro que quieres eliminar el club?</Text>
                  <Text style={styles.confirmHint}>
                    Se eliminará «{club.name}» y todas sus invitaciones. Esta acción no se puede deshacer.
                  </Text>
                  <View style={styles.confirmActions}>
                    <ActionButton label="Sí, eliminar" onPress={handleDeleteConfirm} />
                    <ActionButton label="Cancelar" variant="ghost" onPress={() => setConfirmDelete(false)} />
                  </View>
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  creator: { color: colors.text, fontSize: 14, fontWeight: '600' },
  creatorLink: { color: colors.accent },
  rankBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  rankTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rankMeta: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
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
  statValue: { color: colors.text, fontWeight: '800', fontSize: 18 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  linkTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  linkMeta: { color: colors.textMuted, fontSize: 13 },
  linkHint: { color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 2 },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  memberRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  memberName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  memberEmail: { color: colors.textMuted, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  inviteStatus: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
  ok: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  dangerZone: { marginTop: spacing.lg, gap: spacing.sm },
  confirmBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  confirmHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  confirmActions: { gap: spacing.sm, marginTop: spacing.xs },
});
