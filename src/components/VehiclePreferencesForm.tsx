import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import {
  FUEL_PREFERENCE_OPTIONS,
  VEHICLE_PREFERENCE_OPTIONS,
} from '../lib/preferences';
import type { FuelPreference, VehiclePreference } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  vehicleType?: VehiclePreference;
  fuelPref?: FuelPreference;
  onChangeVehicleType: (value: VehiclePreference) => void;
  onChangeFuelPref: (value: FuelPreference) => void;
  onSave: () => void;
};

export function VehiclePreferencesForm({
  vehicleType,
  fuelPref,
  onChangeVehicleType,
  onChangeFuelPref,
  onSave,
}: Props) {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleSave() {
    onSave();
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Preferencias</Text>
      <Text style={styles.hint}>
        Usamos esto para mostrarte gasolineras de tu combustible y rutas para tu vehículo.
      </Text>

      <Text style={styles.label}>Tipo de vehículo</Text>
      <View style={styles.chipRow}>
        {VEHICLE_PREFERENCE_OPTIONS.map((option) => {
          const active = option.id === vehicleType;
          return (
            <Pressable
              key={option.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChangeVehicleType(option.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.icon} {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Octanaje / combustible preferido</Text>
      <View style={styles.chipRow}>
        {FUEL_PREFERENCE_OPTIONS.map((option) => {
          const active = option.id === fuelPref;
          return (
            <Pressable
              key={option.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChangeFuelPref(option.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ActionButton
        label={saved ? 'Guardado ✓' : 'Guardar preferencias'}
        variant="secondary"
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.xs },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  saveBtn: { marginTop: spacing.sm },
});
