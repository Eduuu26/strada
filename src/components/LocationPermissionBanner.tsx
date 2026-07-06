import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionButton } from './ActionButton';
import { colors, fonts, radius, spacing } from '../theme';
import type { UserLocationStatus } from '../hooks/useUserLocation';

type Props = {
  status: UserLocationStatus;
  hint?: string;
  onRequest: () => void;
  onRefresh?: () => void;
};

export function LocationPermissionBanner({ status, hint, onRequest, onRefresh }: Props) {
  if (status === 'ready') {
    return (
      <View style={styles.readyRow}>
        <Feather name="map-pin" size={14} color={colors.success} />
        <Text style={styles.readyText}>Ubicación activa</Text>
        {onRefresh ? (
          <Pressable onPress={onRefresh} hitSlop={8}>
            <Text style={styles.refreshLink}>Actualizar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Obteniendo tu ubicación…</Text>
        <Text style={styles.bannerText}>
          Si el navegador lo pide, pulsa «Permitir» para ver clubes cerca de ti.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Feather name="map-pin" size={20} color={colors.accent} />
      </View>
      <Text style={styles.bannerTitle}>
        {status === 'denied' ? 'Ubicación no disponible' : 'Clubes cerca de ti'}
      </Text>
      <Text style={styles.bannerText}>
        {hint ??
          'Necesitamos tu ubicación para ordenar los clubes por distancia. Solo se usa en esta pantalla.'}
      </Text>
      {status === 'denied' ? (
        <Text style={styles.fallbackNote}>
          Mientras tanto mostramos resultados desde Madrid como referencia.
        </Text>
      ) : null}
      <ActionButton
        label={status === 'denied' ? 'Volver a intentar' : 'Usar mi ubicación'}
        onPress={onRequest}
        style={styles.btn}
      />
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    ...font,
  },
  bannerText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    ...font,
  },
  fallbackNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    ...font,
  },
  btn: { marginTop: spacing.xs },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  readyText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    ...font,
  },
  refreshLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    ...font,
  },
});
