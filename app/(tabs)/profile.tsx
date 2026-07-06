import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { LegalAccountSection } from '../../src/components/LegalAccountSection';
import { ScreenHero } from '../../src/components/ScreenHero';
import { AvatarPickerModal } from '../../src/components/AvatarPickerModal';
import { CreatePostModal } from '../../src/components/CreatePostModal';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { ProfileSocialsForm } from '../../src/components/ProfileSocialsForm';
import { VehicleFormModal } from '../../src/components/VehicleFormModal';
import { VehiclePreferencesForm } from '../../src/components/VehiclePreferencesForm';
import { ClubCreationRequestsAdmin } from '../../src/components/ClubCreationRequestsAdmin';
import { ClubApprovalNotification } from '../../src/components/ClubApprovalNotification';
import { DiscoverProfilesPanel } from '../../src/components/DiscoverProfilesPanel';
import { ProfileConnectionActions } from '../../src/components/ProfileConnectionActions';
import { SocialConnectionsList } from '../../src/components/SocialConnectionsList';
import { useAuth } from '../../src/context/AuthContext';
import { useClubs } from '../../src/context/ClubsContext';
import { useFeed } from '../../src/context/FeedContext';
import { useRoutes } from '../../src/context/RoutesContext';
import { useSocial } from '../../src/context/SocialContext';
import {
  vehicleDisplayMeta,
  vehicleDisplayTitle,
  vehicleIcon,
  vehiclePhotoUrl,
} from '../../src/data/vehicles';
import type { FuelPreference, UserSocials, UserVehicle, VehiclePreference } from '../../src/types';
import { normalizeSocials } from '../../src/lib/socials';
import { isPlatformAdmin } from '../../src/lib/platformAdmin';
import { useCookieConsentInset } from '../../src/context/CookieConsentContext';
import { colors, radius, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    logout,
    updateAvatar,
    removeAvatar,
    addVehicle,
    updateVehicle,
    removeVehicle,
    setDefaultVehicle,
    updateSocials,
    updatePreferences,
  } = useAuth();
  const { routes, signups } = useRoutes();
  const { getUnreadClubApprovalNotifications, markClubApprovalSeen } = useClubs();
  const { createPost, getUserPostCount } = useFeed();
  const {
    getFollowerCount,
    getFollowingCount,
    getFriendCount,
    getFriendsList,
    getFollowersList,
    getFollowingList,
  } = useSocial();
  const [createOpen, setCreateOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [socialsDraft, setSocialsDraft] = useState<UserSocials>(normalizeSocials());
  const [vehicleTypeDraft, setVehicleTypeDraft] = useState<VehiclePreference | undefined>(undefined);
  const [fuelPrefDraft, setFuelPrefDraft] = useState<FuelPreference | undefined>(undefined);
  const cookieInset = useCookieConsentInset(spacing.xl);

  useEffect(() => {
    if (user) {
      setSocialsDraft(normalizeSocials(user.socials));
      setVehicleTypeDraft(user.vehicleType);
      setFuelPrefDraft(user.fuelPref);
    }
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: cookieInset }]}>
          <ScreenHero
            kicker="Tu cuenta"
            title="Perfil"
            subtitle="Guarda vehículos, publica en el feed y apúntate a rutas con tu garaje."
          />
          <View style={styles.benefitsCard}>
            {['Garaje con fotos de coche o moto', 'Match y perfil público', 'Rutas, quedadas y chats'].map(
              (item) => (
                <Text key={item} style={styles.benefitItem}>
                  ✓ {item}
                </Text>
              ),
            )}
          </View>
          <Link href="/login" asChild>
            <ActionButton label="Iniciar sesión" />
          </Link>
          <Link href="/register" asChild>
            <ActionButton label="Crear cuenta" variant="secondary" />
          </Link>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const vehicles = user.vehicles ?? [];
  const myRoutes = routes.filter((r) => r.creatorEmail === user.email).length;
  const mySignups = signups.filter((s) => s.userEmail === user.email).length;
  const myPosts = getUserPostCount(user.email);
  const approvalNotifications = getUnreadClubApprovalNotifications(user.email);

  function openAddVehicle() {
    setEditingVehicle(null);
    setVehicleOpen(true);
  }

  function openEditVehicle(vehicle: UserVehicle) {
    setEditingVehicle(vehicle);
    setVehicleOpen(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: cookieInset }]}>
        <View style={styles.profileCard}>
          <ProfileAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            size={72}
            onPress={() => setAvatarOpen(true)}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Pressable onPress={() => setAvatarOpen(true)}>
              <Text style={styles.changePhoto}>Cambiar foto de perfil</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/user/${encodeURIComponent(user.email)}`)}>
              <Text style={styles.viewPublic}>Ver perfil público →</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{myRoutes}</Text>
            <Text style={styles.statLabel}>Rutas creadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{mySignups}</Text>
            <Text style={styles.statLabel}>Apuntado</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{myPosts}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLinks}>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/match')}>
            <Text style={styles.quickLinkText}>❤️ Match</Text>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.quickLinkText}>🧭 Feed</Text>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/drive')}>
            <Text style={styles.quickLinkText}>🗺️ Conducir</Text>
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/chats')}>
            <Text style={styles.quickLinkText}>💬 Chats</Text>
          </Pressable>
        </ScrollView>

        <ProfileConnectionActions
          targetEmail={user.email}
          targetName={user.name}
          followerCount={getFollowerCount(user.email)}
          followingCount={getFollowingCount(user.email)}
          friendCount={getFriendCount(user.email)}
          isSelf
        />

        <SocialConnectionsList
          title="Amigos"
          emails={getFriendsList(user.email)}
          emptyMessage="Aún no tienes amigos. Visita perfiles y envía solicitudes de amistad."
          defaultExpanded
        />
        <SocialConnectionsList
          title="Siguiendo"
          emails={getFollowingList(user.email)}
          emptyMessage="No sigues a nadie todavía."
        />
        <SocialConnectionsList
          title="Seguidores"
          emails={getFollowersList(user.email)}
          emptyMessage="Nadie te sigue todavía."
        />

        <DiscoverProfilesPanel />

        <View style={styles.sectionHeader}>
          <Text style={styles.section}>Mis vehículos</Text>
          <Text style={styles.sectionHint}>Coche o moto con marca, modelo, año y foto obligatoria</Text>
        </View>

        {vehicles.length === 0 ? (
          <EmptyState
            icon="🚗"
            title="Tu garaje está vacío"
            message="Añade tu coche o moto con marca, modelo, año y foto para apuntarte a rutas y aparecer en Match."
            actionLabel="+ Añadir vehículo"
            onAction={openAddVehicle}
          />
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleRow}>
              <Image
                source={{ uri: vehiclePhotoUrl(vehicle) }}
                style={styles.vehicleThumb}
                resizeMode="cover"
              />
              <View style={styles.vehicleRowBody}>
                <Text style={styles.vehicleRowLabel}>{vehicleDisplayTitle(vehicle)}</Text>
                <Text style={styles.vehicleRowType}>{vehicleDisplayMeta(vehicle)}</Text>
              </View>
              {vehicle.isDefault ? (
                <Text style={styles.defaultBadge}>Principal</Text>
              ) : (
                <Pressable onPress={() => setDefaultVehicle(vehicle.id)}>
                  <Text style={styles.linkAction}>Hacer principal</Text>
                </Pressable>
              )}
              <Pressable onPress={() => openEditVehicle(vehicle)}>
                <Text style={styles.linkAction}>Editar</Text>
              </Pressable>
              <Pressable onPress={() => removeVehicle(vehicle.id)}>
                <Text style={styles.dangerAction}>Eliminar</Text>
              </Pressable>
            </View>
          ))
        )}

        {vehicles.length > 0 ? (
          <ActionButton
            label="+ Añadir vehículo"
            variant="secondary"
            onPress={openAddVehicle}
            style={styles.profileActionBtn}
          />
        ) : null}

        <VehiclePreferencesForm
          vehicleType={vehicleTypeDraft}
          fuelPref={fuelPrefDraft}
          onChangeVehicleType={setVehicleTypeDraft}
          onChangeFuelPref={setFuelPrefDraft}
          onSave={() =>
            updatePreferences({ vehicleType: vehicleTypeDraft, fuelPref: fuelPrefDraft })
          }
        />

        <ProfileSocialsForm
          value={socialsDraft}
          onChange={setSocialsDraft}
          onSave={() => updateSocials(socialsDraft)}
        />

        {approvalNotifications.map((notification) => (
          <ClubApprovalNotification
            key={notification.id}
            notification={notification}
            onViewClub={(clubId) => {
              markClubApprovalSeen(notification.id, user.email);
              router.push(`/club/${clubId}`);
            }}
            onDismiss={() => markClubApprovalSeen(notification.id, user.email)}
          />
        ))}

        {isPlatformAdmin(user.email) ? <ClubCreationRequestsAdmin adminEmail={user.email} /> : null}

        <LegalAccountSection />

        <View style={styles.profileActions}>
          <ActionButton
            label="👁 Ver mi perfil público"
            variant="secondary"
            onPress={() => router.push(`/user/${encodeURIComponent(user.email)}`)}
            style={styles.profileActionBtn}
          />
          <ActionButton
            label="+ Nueva publicación"
            variant="secondary"
            onPress={() => setCreateOpen(true)}
            style={styles.profileActionBtn}
          />
          <ActionButton
            label="Cerrar sesión"
            variant="secondary"
            onPress={logout}
            style={styles.profileActionBtn}
          />
        </View>
      </ScrollView>

      <AvatarPickerModal
        visible={avatarOpen}
        currentUrl={user.avatarUrl}
        onClose={() => setAvatarOpen(false)}
        onSelect={updateAvatar}
        onRemove={removeAvatar}
      />

      <VehicleFormModal
        visible={vehicleOpen}
        vehicle={editingVehicle}
        onClose={() => setVehicleOpen(false)}
        onSave={(input) => {
          if (editingVehicle) {
            updateVehicle(editingVehicle.id, input);
          } else {
            addVehicle(input);
          }
        }}
      />

      <CreatePostModal
        visible={createOpen}
        authorName={user.name}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (input) => {
          await createPost(input, user);
          router.push('/feed');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  benefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  benefitItem: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  profileEmail: { color: colors.textMuted, fontSize: 14 },
  changePhoto: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
  viewPublic: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  quickLinks: { gap: spacing.sm, paddingVertical: spacing.xs },
  quickLink: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickLinkText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  sectionHeader: { gap: 2, marginTop: spacing.sm },
  section: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sectionHint: { color: colors.textMuted, fontSize: 13 },
  emptyVehicles: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  vehicleThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  vehicleRowBody: { flex: 1, minWidth: 120, gap: 2 },
  vehicleRowLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  vehicleRowType: { color: colors.textMuted, fontSize: 13 },
  defaultBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  linkAction: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  dangerAction: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  profileActionBtn: { alignSelf: 'stretch', minHeight: 48 },
  profileActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
