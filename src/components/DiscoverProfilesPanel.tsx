import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { SEED_PUBLIC_PROFILES } from '../data/seedProfiles';
import { vehiclePhotoUrl } from '../data/vehicles';
import { normalizeEmail } from '../lib/email';
import { colors, radius, spacing } from '../theme';

export function DiscoverProfilesPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { getConnectionStatus, follow, getConnectionLabel } = useSocial();

  const suggestions = useMemo(() => {
    if (!user) return SEED_PUBLIC_PROFILES.slice(0, 6);
    const self = normalizeEmail(user.email);
    return SEED_PUBLIC_PROFILES.filter((p) => {
      const email = normalizeEmail(p.email);
      if (email === self) return false;
      const status = getConnectionStatus(email);
      return status === 'none' || status === 'follower';
    }).slice(0, 8);
  }, [user, getConnectionStatus]);

  if (!suggestions.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Descubre conductores</Text>
      <Text style={styles.sub}>Perfiles con coches y motos para seguir o pedir amistad.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {suggestions.map((profile) => {
          const vehicle = profile.vehicles[0];
          const status = user ? getConnectionStatus(profile.email) : 'none';
          const label = user ? getConnectionLabel(profile.email) : null;
          const canFollow = user && status !== 'following' && status !== 'mutual_follow' && status !== 'friend';
          return (
            <View key={profile.email} style={styles.card}>
              <Pressable onPress={() => router.push(`/user/${encodeURIComponent(profile.email)}`)}>
                {vehicle ? (
                  <Image
                    source={{ uri: vehiclePhotoUrl(vehicle) }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoIcon}>🚗</Text>
                  </View>
                )}
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
                {label ? <Text style={styles.statusChip}>{label}</Text> : null}
              </Pressable>
              {canFollow ? (
                <Pressable style={styles.followBtn} onPress={() => follow(profile.email)}>
                  <Text style={styles.followText}>Seguir</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  card: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 88 },
  photoPlaceholder: {
    width: '100%',
    height: 88,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: { fontSize: 28 },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  statusChip: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  followBtn: {
    margin: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 6,
    alignItems: 'center',
  },
  followText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
});
