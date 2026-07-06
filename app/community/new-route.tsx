import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../src/components/ActionButton';
import { ScreenHero } from '../../src/components/ScreenHero';
import { useCommunityRoutes } from '../../src/hooks/useCommunityRoutes';
import { formatMeters, isValidLngLat, lineDistanceMeters } from '../../src/lib/routeGeo';
import type {
  CreateRouteStopInput,
  GeoLineString,
  RouteDifficulty,
  RouteStopType,
} from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';

type DraftStop = {
  name: string;
  lat: string;
  lng: string;
  stopType: RouteStopType;
};

const DIFFICULTIES: { id: RouteDifficulty; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'media', label: 'Media' },
  { id: 'dificil', label: 'Difícil' },
];

const STOP_TYPES: RouteStopType[] = ['inicio', 'parada', 'repostaje', 'comida', 'fin', 'interes'];

function emptyStop(stopType: RouteStopType = 'parada'): DraftStop {
  return { name: '', lat: '', lng: '', stopType };
}

export default function NewRouteScreen() {
  const router = useRouter();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const id = String(communityId);
  const { createRoute } = useCommunityRoutes(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<RouteDifficulty | undefined>(undefined);
  const [stops, setStops] = useState<DraftStop[]>([emptyStop('inicio'), emptyStop('fin')]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateStop(index: number, patch: Partial<DraftStop>) {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStop() {
    setStops((prev) => [...prev, emptyStop()]);
  }

  function removeStop(index: number) {
    setStops((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  // Coordenadas [lng, lat] válidas para el trazado.
  const coords = stops
    .map((s) => [Number(s.lng.replace(',', '.')), Number(s.lat.replace(',', '.'))] as [number, number])
    .filter((c) => isValidLngLat(c));

  const distancePreview = coords.length >= 2 ? lineDistanceMeters({ type: 'LineString', coordinates: coords }) : 0;

  async function onSubmit() {
    setError(null);
    if (title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (coords.length < 2) {
      setError('Necesitas al menos 2 paradas con coordenadas válidas.');
      return;
    }

    const geom: GeoLineString = { type: 'LineString', coordinates: coords };
    const stopInputs: CreateRouteStopInput[] = stops
      .map((s, i): CreateRouteStopInput | null => {
        const lng = Number(s.lng.replace(',', '.'));
        const lat = Number(s.lat.replace(',', '.'));
        if (!isValidLngLat([lng, lat])) return null;
        return {
          position: i,
          name: s.name.trim() || `Parada ${i + 1}`,
          stopType: s.stopType,
          geom: { type: 'Point', coordinates: [lng, lat] },
        };
      })
      .filter((s): s is CreateRouteStopInput => s !== null);

    setSaving(true);
    try {
      const res = await createRoute({
        communityId: id,
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        geom,
        stops: stopInputs,
        status: 'draft',
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Nueva ruta"
          title="Crear ruta"
          subtitle="Define el recorrido con sus paradas. El trazado une las paradas en orden."
        />

        <View style={styles.field}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej. Ruta de los puertos"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalles del recorrido…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Dificultad</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => {
              const active = d.id === difficulty;
              return (
                <Pressable
                  key={d.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDifficulty(active ? undefined : d.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.section}>Paradas ({coords.length} válidas)</Text>
          <Text style={styles.distance}>{distancePreview ? formatMeters(distancePreview) : ''}</Text>
        </View>

        {stops.map((stop, index) => (
          <View key={index} style={styles.stopCard}>
            <View style={styles.stopHeader}>
              <Text style={styles.stopIndex}>#{index + 1}</Text>
              {stops.length > 2 ? (
                <Pressable onPress={() => removeStop(index)}>
                  <Text style={styles.remove}>Quitar</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              value={stop.name}
              onChangeText={(t) => updateStop(index, { name: t })}
              placeholder="Nombre de la parada"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.coordRow}>
              <TextInput
                style={[styles.input, styles.coordInput]}
                value={stop.lat}
                onChangeText={(t) => updateStop(index, { lat: t })}
                placeholder="Latitud"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.coordInput]}
                value={stop.lng}
                onChangeText={(t) => updateStop(index, { lng: t })}
                placeholder="Longitud"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.typeRow}>
              {STOP_TYPES.map((t) => {
                const active = t === stop.stopType;
                return (
                  <Pressable
                    key={t}
                    style={[styles.typeChip, active && styles.chipActive]}
                    onPress={() => updateStop(index, { stopType: t })}
                  >
                    <Text style={[styles.typeText, active && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <ActionButton label="+ Añadir parada" variant="secondary" onPress={addStop} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ActionButton
          label={saving ? 'Guardando…' : 'Guardar ruta (borrador)'}
          onPress={onSubmit}
          disabled={saving}
        />
        <ActionButton label="Cancelar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  field: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    fontSize: 15,
  },
  multiline: { minHeight: 84, paddingTop: spacing.sm, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  section: { color: colors.text, fontSize: 16, fontWeight: '800' },
  distance: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stopIndex: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  remove: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  coordRow: { flexDirection: 'row', gap: spacing.sm },
  coordInput: { flex: 1 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  typeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
});
