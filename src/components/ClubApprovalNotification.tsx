import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import type { ClubCreationRequest } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  notification: ClubCreationRequest;
  onViewClub: (clubId: string) => void;
  onDismiss: () => void;
};

export function ClubApprovalNotification({ notification, onViewClub, onDismiss }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>¡Club aprobado!</Text>
      <Text style={styles.text}>
        El equipo de Strada ha aceptado tu petición. El club «{notification.name}» ya está creado y
        eres su fundador.
      </Text>
      <View style={styles.actions}>
        {notification.createdClubId ? (
          <ActionButton
            label="Ver club"
            onPress={() => onViewClub(notification.createdClubId!)}
            style={styles.btn}
          />
        ) : null}
        <ActionButton label="Entendido" variant="secondary" onPress={onDismiss} style={styles.btn} />
      </View>
    </View>
  );
}

export function ClubRequestPendingBanner({ clubName }: { clubName: string }) {
  return (
    <View style={styles.pendingBox}>
      <Text style={styles.pendingTitle}>Petición en estudio</Text>
      <Text style={styles.pendingText}>
        El equipo de Strada está estudiando tu petición de creación del club «{clubName}». La revisión
        se envía a administración y te notificaremos aquí cuando haya una decisión.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  text: { color: colors.text, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btn: { flex: 1 },
  pendingBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
    gap: spacing.xs,
  },
  pendingTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  pendingText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
