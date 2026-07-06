import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import {
  memberVehiclesForClub,
  vehicleDisplayMeta,
  vehicleDisplayTitle,
  vehicleIcon,
  vehiclePhotoUrl,
} from '../data/vehicles';
import type { RouteVehicleMode } from '../lib/routeVehicles';
import { colors, radius, spacing } from '../theme';

export type ClubMemberProfile = {
  email: string;
  name: string;
  avatarUrl?: string;
  vehicles?: import('../types').UserVehicle[];
};

type Props = {
  members: ClubMemberProfile[];
  creatorEmail: string;
  vehicleMode: RouteVehicleMode;
  onPressMember?: (email: string) => void;
};

export function ClubMembersGallery({ members, creatorEmail, vehicleMode, onPressMember }: Props) {
  const { user } = useAuth();
  const { getConnectionLabel } = useSocial();

  return (
    <View style={styles.grid}>
      {members.map((member) => {
        const isOwner = member.email.toLowerCase() === creatorEmail.toLowerCase();
        const vehicles = memberVehiclesForClub(member.vehicles, vehicleMode);
        const isSelf = user && member.email.toLowerCase() === user.email.toLowerCase();
        const connectionLabel =
          user && !isSelf ? getConnectionLabel(member.email) : null;
        return (
          <View key={member.email} style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.header, pressed && onPressMember && styles.headerPressed]}
              onPress={() => onPressMember?.(member.email)}
              disabled={!onPressMember}
            >
              {member.avatarUrl ? (
                <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.name}>{member.name}</Text>
                {isOwner ? <Text style={styles.badge}>Fundador</Text> : null}
                {connectionLabel ? (
                  <Text style={styles.connectionChip}>{connectionLabel}</Text>
                ) : null}
              </View>
              {onPressMember ? <Text style={styles.viewProfile}>Ver perfil →</Text> : null}
            </Pressable>
            {vehicles.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
                {vehicles.map((vehicle) => (
                  <View key={vehicle.id} style={styles.vehicleCard}>
                    <Image source={{ uri: vehiclePhotoUrl(vehicle) }} style={styles.vehiclePhoto} />
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleIcon}>{vehicleIcon(vehicle.type)}</Text>
                      <View style={styles.vehicleText}>
                        <Text style={styles.vehicleTitle} numberOfLines={1}>
                          {vehicleDisplayTitle(vehicle)}
                        </Text>
                        <Text style={styles.vehicleMeta} numberOfLines={1}>
                          {vehicleDisplayMeta(vehicle)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyVehicles}>
                <Text style={styles.emptyText}>Sin vehículo registrado</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: colors.text, fontSize: 18, fontWeight: '800' },
  headerPressed: { opacity: 0.6 },
  headerText: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  badge: { color: colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  connectionChip: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  viewProfile: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  vehicleRow: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  vehicleCard: {
    width: 168,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  vehiclePhoto: { width: '100%', height: 96 },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  vehicleIcon: { fontSize: 18 },
  vehicleText: { flex: 1, minWidth: 0 },
  vehicleTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  vehicleMeta: { color: colors.textMuted, fontSize: 11 },
  emptyVehicles: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
