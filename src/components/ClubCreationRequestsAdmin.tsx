import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { useClubs } from '../context/ClubsContext';
import { isPlatformAdmin } from '../lib/platformAdmin';
import { routeVehicleModeLabel } from '../lib/routeVehicles';
import { colors, radius, spacing } from '../theme';

type Props = {
  adminEmail: string;
};

export function ClubCreationRequestsAdmin({ adminEmail }: Props) {
  const {
    getPendingClubCreationRequestsForAdmin,
    approveClubCreationRequest,
    rejectClubCreationRequest,
  } = useClubs();

  if (!isPlatformAdmin(adminEmail)) return null;

  const pending = getPendingClubCreationRequestsForAdmin();
  if (!pending.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Solicitudes de nuevos clubes ({pending.length})</Text>
      {pending.map((req) => (
        <View key={req.id} style={styles.card}>
          <Text style={styles.clubName}>{req.name}</Text>
          <Text style={styles.meta}>
            Solicita {req.requesterName} · {routeVehicleModeLabel(req.vehicleMode)}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {req.description}
          </Text>
          {req.locationLabel ? <Text style={styles.meta}>📍 {req.locationLabel}</Text> : null}
          <View style={styles.actions}>
            <ActionButton
              label="Aprobar y crear"
              onPress={() => approveClubCreationRequest(req.id, adminEmail)}
              style={styles.btn}
            />
            <ActionButton
              label="Rechazar"
              variant="secondary"
              onPress={() => rejectClubCreationRequest(req.id, adminEmail)}
              style={styles.btn}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  clubName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 13 },
  description: { color: colors.text, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1 },
});
