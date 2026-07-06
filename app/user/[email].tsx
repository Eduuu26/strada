import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileAvatar } from '../../src/components/ProfileAvatar';
import { ProfileConnectionActions } from '../../src/components/ProfileConnectionActions';
import { ProfileSocialLinks } from '../../src/components/ProfileSocialLinks';
import { ReportContentModal } from '../../src/components/ReportContentModal';
import { useAuth } from '../../src/context/AuthContext';
import { useFeed } from '../../src/context/FeedContext';
import { useSocial } from '../../src/context/SocialContext';
import { getSeedPublicProfile } from '../../src/data/seedProfiles';
import {
  vehicleDisplayMeta,
  vehicleDisplayTitle,
  vehicleIcon,
  vehiclePhotoUrl,
} from '../../src/data/vehicles';
import { fetchPublicProfile } from '../../src/lib/backend/profiles';
import { normalizeEmail } from '../../src/lib/email';
import type { UserSocials, UserVehicle } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';

type PublicProfile = {
  email: string;
  name: string;
  avatarUrl?: string;
  vehicles: UserVehicle[];
  socials?: UserSocials;
};

function enrichProfileVehicles(email: string, vehicles: UserVehicle[]): UserVehicle[] {
  const seed = getSeedPublicProfile(email);
  const withPhotos = vehicles.map((vehicle, index) => {
    if (vehicle.photoUrl?.trim()) return vehicle;
    const seedVehicle =
      seed?.vehicles.find(
        (candidate) =>
          candidate.id === vehicle.id ||
          (candidate.brand === vehicle.brand && candidate.model === vehicle.model),
      ) ?? seed?.vehicles[index];
    if (seedVehicle?.photoUrl?.trim()) {
      return { ...vehicle, photoUrl: seedVehicle.photoUrl };
    }
    return vehicle;
  });
  if (withPhotos.length) return withPhotos;
  return seed?.vehicles ?? [];
}

function toPublicProfile(
  email: string,
  data: Omit<PublicProfile, 'email'> & { email?: string },
): PublicProfile {
  return {
    email: normalizeEmail(data.email ?? email),
    name: data.name,
    avatarUrl: data.avatarUrl,
    vehicles: enrichProfileVehicles(email, data.vehicles ?? []),
    socials: data.socials,
  };
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = normalizeEmail(decodeURIComponent(rawEmail ?? ''));
  const { user, getUserProfileByEmail } = useAuth();
  const { getFollowerCount, getFollowingCount, getFriendCount } = useSocial();
  const { getUserPostCount } = useFeed();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const isSelf = !!user && normalizeEmail(user.email) === email;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      if (user && normalizeEmail(user.email) === email) {
        if (active) {
          setProfile(
            toPublicProfile(email, {
              email: user.email,
              name: user.name,
              avatarUrl: user.avatarUrl,
              vehicles: user.vehicles ?? [],
              socials: user.socials,
            }),
          );
          setLoading(false);
        }
        return;
      }

      const remote = await fetchPublicProfile(email);
      if (remote && active) {
        setProfile(toPublicProfile(email, remote));
        setLoading(false);
        return;
      }

      const fallback = getUserProfileByEmail(email);
      if (active) {
        setProfile(fallback ? toPublicProfile(email, fallback) : null);
        setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [email, user, getUserProfileByEmail]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.empty}>No se encontró el perfil de este usuario.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const vehicles = profile.vehicles ?? [];
  const postCount = getUserPostCount(profile.email);
  const hasGarage = vehicles.some((v) => v.photoUrl || v.brand);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{isSelf ? 'Tu perfil público' : 'Perfil público'}</Text>
        <View style={styles.profileCard}>
          <ProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            {isSelf ? <Text style={styles.selfBadge}>Así ven los demás tu perfil</Text> : null}
            {postCount > 0 ? (
              <Text style={styles.postCount}>{postCount} publicaciones en el feed</Text>
            ) : null}
          </View>
        </View>

        {!isSelf && hasGarage ? (
          <Pressable style={styles.matchLink} onPress={() => router.push('/(tabs)/match')}>
            <Text style={styles.matchLinkText}>🚗 Ver vehículos en Match</Text>
          </Pressable>
        ) : null}

        {!isSelf ? (
          <Pressable style={styles.reportLink} onPress={() => setReportOpen(true)}>
            <Text style={styles.reportLinkText}>⚠ Reportar perfil</Text>
          </Pressable>
        ) : null}

        <ProfileConnectionActions
          targetEmail={profile.email}
          targetName={profile.name}
          followerCount={getFollowerCount(profile.email)}
          followingCount={getFollowingCount(profile.email)}
          friendCount={getFriendCount(profile.email)}
          isSelf={isSelf}
        />

        <Text style={styles.section}>Redes sociales</Text>
        <ProfileSocialLinks socials={profile.socials} />

        <Text style={styles.section}>Vehículos</Text>
        {vehicles.length === 0 ? (
          <Text style={styles.empty}>Este usuario no ha publicado vehículos.</Text>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <Image
                source={{ uri: vehiclePhotoUrl(vehicle) }}
                style={styles.vehiclePhoto}
                resizeMode="cover"
              />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleTypeIcon}>{vehicleIcon(vehicle.type)}</Text>
                <View style={styles.vehicleBody}>
                  <Text style={styles.vehicleTitle}>{vehicleDisplayTitle(vehicle)}</Text>
                  <Text style={styles.vehicleMeta}>{vehicleDisplayMeta(vehicle)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ReportContentModal
        visible={reportOpen}
        targetEmail={profile.email}
        targetName={profile.name}
        contextType="profile"
        onClose={() => setReportOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
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
  profileName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  selfBadge: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  postCount: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  matchLink: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    alignItems: 'center',
  },
  matchLinkText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  reportLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  reportLinkText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  vehicleCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  vehiclePhoto: { width: '100%', height: 200 },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  vehicleTypeIcon: { fontSize: 22 },
  vehicleBody: { flex: 1, gap: 2 },
  vehicleTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  vehicleMeta: { color: colors.textMuted, fontSize: 13 },
});
