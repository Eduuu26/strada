import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FuelPreference, FuelStationNearRoute } from '../types';
import { fuelPreferenceLabel } from '../lib/preferences';
import { formatMeters } from '../lib/routeGeo';
import { cardStyle, colors, fonts, radius, spacing } from '../theme';

type Props = {
  fuelKey: FuelPreference;
  stations: FuelStationNearRoute[];
  loading?: boolean;
  cheapestId?: number;
};

function openStation(station: FuelStationNearRoute) {
  const [lng, lat] = station.geom.coordinates;
  void Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
  );
}

export function FuelStationsPanel({ fuelKey, stations, loading, cheapestId }: Props) {
  if (loading) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>⛽ Gasolineras · {fuelPreferenceLabel(fuelKey)}</Text>
        <Text style={styles.muted}>Buscando gasolineras con {fuelPreferenceLabel(fuelKey).toLowerCase()}…</Text>
      </View>
    );
  }

  if (!stations.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>⛽ Gasolineras · {fuelPreferenceLabel(fuelKey)}</Text>
        <Text style={styles.muted}>
          No hay gasolineras con {fuelPreferenceLabel(fuelKey).toLowerCase()} cerca de esta ruta (2 km).
          Cambia tu preferencia en Perfil si usas otro combustible.
        </Text>
      </View>
    );
  }

  const sorted = [...stations].sort((a, b) => a.price - b.price);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        ⛽ {stations.length} gasolineras con {fuelPreferenceLabel(fuelKey)}
      </Text>
      <Text style={styles.muted}>Filtradas según tu preferencia de perfil. Toca para navegar.</Text>
      {sorted.slice(0, 8).map((s) => {
        const isCheapest = s.id === cheapestId;
        return (
          <Pressable
            key={s.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isCheapest && styles.rowCheapest]}
            onPress={() => openStation(s)}
          >
            <View style={styles.rowBody}>
              <Text style={styles.rowName}>
                {isCheapest ? '🏆 ' : '⛽ '}
                {s.brand ?? 'Gasolinera'}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {[s.municipality, s.address].filter(Boolean).join(' · ')} · {formatMeters(s.distanceM)}
              </Text>
            </View>
            <Text style={styles.price}>{s.price.toFixed(3)} €</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  wrap: {
    ...cardStyle,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', ...font },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18, ...font },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowCheapest: {
    backgroundColor: colors.accentSoft,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: { color: colors.text, fontWeight: '700', fontSize: 14 },
  rowMeta: { color: colors.textMuted, fontSize: 12 },
  price: { color: colors.accent, fontWeight: '800', fontSize: 14 },
});
