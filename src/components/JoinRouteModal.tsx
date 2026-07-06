import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import {
  vehicleDisplayMeta,
  vehicleDisplayTitle,
  vehiclePhotoUrl,
} from '../data/vehicles';
import { vehicleMatchesRoute, routeVehicleModeIcon, routeVehicleModeLabel } from '../lib/routeVehicles';
import type { RouteVehicleMode, UserVehicle } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  routeTitle: string;
  vehicleMode?: RouteVehicleMode;
  vehicles: UserVehicle[];
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (vehicle: UserVehicle) => void;
  onManageVehicles: () => void;
};

export function JoinRouteModal({
  visible,
  routeTitle,
  vehicleMode = 'mixto',
  vehicles,
  confirmLabel = 'Confirmar apunte',
  onClose,
  onConfirm,
  onManageVehicles,
}: Props) {
  const compatible = vehicles.filter((v) => vehicleMatchesRoute({ vehicleMode }, v.type));
  const incompatible = vehicles.filter((v) => !vehicleMatchesRoute({ vehicleMode }, v.type));
  const defaultVehicle = compatible.find((v) => v.isDefault) ?? compatible[0];
  const [selectedId, setSelectedId] = useState<string | null>(defaultVehicle?.id ?? null);

  useEffect(() => {
    if (visible) {
      const initial = compatible.find((v) => v.isDefault) ?? compatible[0];
      setSelectedId(initial?.id ?? null);
    }
  }, [visible, vehicles, vehicleMode]);

  function handleConfirm() {
    const picked = compatible.find((v) => v.id === selectedId);
    if (!picked) return;
    onConfirm(picked);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Apuntarse a la ruta</Text>
          <Text style={styles.subtitle}>{routeTitle}</Text>
          <Text style={styles.modeHint}>
            {routeVehicleModeIcon(vehicleMode)} {routeVehicleModeLabel(vehicleMode)}
          </Text>
          <Text style={styles.label}>¿Con qué vehículo vas?</Text>

          {compatible.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {vehicles.length
                  ? `Esta ruta es ${routeVehicleModeLabel(vehicleMode)}. Añade un vehículo compatible en tu perfil.`
                  : 'Aún no tienes vehículos guardados. Añade al menos uno en tu perfil.'}
              </Text>
              <ActionButton label="Ir a mi perfil" onPress={onManageVehicles} />
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {compatible.map((vehicle) => {
                const active = selectedId === vehicle.id;
                return (
                  <Pressable
                    key={vehicle.id}
                    onPress={() => setSelectedId(vehicle.id)}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                  >
                    <Image
                      source={{ uri: vehiclePhotoUrl(vehicle) }}
                      style={styles.vehiclePhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.vehicleBody}>
                      <Text style={styles.vehicleLabel}>{vehicleDisplayTitle(vehicle)}</Text>
                      <Text style={styles.vehicleType}>{vehicleDisplayMeta(vehicle)}</Text>
                      {vehicle.isDefault ? (
                        <Text style={styles.defaultInline}>Vehículo principal</Text>
                      ) : null}
                    </View>
                    {active ? <Text style={styles.checkMark}>✓</Text> : null}
                  </Pressable>
                );
              })}
              {incompatible.length > 0 ? (
                <>
                  <Text style={styles.incompatibleTitle}>No compatibles con esta ruta</Text>
                  {incompatible.map((vehicle) => (
                    <View key={vehicle.id} style={[styles.vehicleCard, styles.vehicleCardDisabled]}>
                      <Image
                        source={{ uri: vehiclePhotoUrl(vehicle) }}
                        style={[styles.vehiclePhoto, styles.vehiclePhotoDisabled]}
                        resizeMode="cover"
                      />
                      <View style={styles.vehicleBody}>
                        <Text style={styles.vehicleLabelDisabled}>{vehicleDisplayTitle(vehicle)}</Text>
                        <Text style={styles.vehicleType}>{vehicleDisplayMeta(vehicle)}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null}
            </ScrollView>
          )}

          <ActionButton
            label={confirmLabel}
            onPress={handleConfirm}
            disabled={!selectedId}
          />
          <ActionButton label="Gestionar vehículos" variant="secondary" onPress={onManageVehicles} />
          <ActionButton label="Cancelar" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '88%',
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14 },
  modeHint: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  label: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: spacing.xs },
  emptyBox: { gap: spacing.sm, paddingVertical: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  list: { maxHeight: 340 },
  listContent: { gap: spacing.sm, paddingVertical: spacing.sm },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  vehicleCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  vehicleCardDisabled: { opacity: 0.55 },
  vehiclePhoto: {
    width: 88,
    height: 66,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  vehiclePhotoDisabled: { opacity: 0.7 },
  vehicleBody: { flex: 1, gap: 2, paddingVertical: spacing.xs },
  vehicleLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  vehicleLabelDisabled: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  vehicleType: { color: colors.textMuted, fontSize: 13 },
  defaultInline: { color: colors.accent, fontSize: 11, fontWeight: '700', marginTop: 2 },
  checkMark: { color: colors.accent, fontSize: 20, fontWeight: '800', paddingRight: spacing.xs },
  incompatibleTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
