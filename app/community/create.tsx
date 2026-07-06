import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../src/components/ActionButton';
import { ScreenHero } from '../../src/components/ScreenHero';
import { useCommunities } from '../../src/context/CommunitiesContext';
import type { CommunityVisibility } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';

const VISIBILITY_OPTIONS: { id: CommunityVisibility; label: string; hint: string }[] = [
  { id: 'public', label: 'Pública', hint: 'Cualquiera la encuentra y puede unirse.' },
  { id: 'private', label: 'Privada', hint: 'Solo visible para miembros e invitados.' },
];

export default function CreateCommunityScreen() {
  const router = useRouter();
  const { createCommunity } = useCommunities();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('public');
  const [priceEuros, setPriceEuros] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaving(true);
    try {
      const cents = Math.round(Number(priceEuros.replace(',', '.')) * 100);
      const res = await createCommunity({
        name,
        description: description.trim() || undefined,
        visibility,
        priceCents: Number.isFinite(cents) && cents > 0 ? cents : 0,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(`/community/${res.value.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Nueva comunidad"
          title="Crear comunidad"
          subtitle="Las comunidades de pago te permiten cobrar una suscripción mensual a tus miembros."
        />

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Moteros del Norte"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="¿De qué va tu comunidad?"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Visibilidad</Text>
          <View style={styles.chipRow}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = opt.id === visibility;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setVisibility(opt.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            {VISIBILITY_OPTIONS.find((o) => o.id === visibility)?.hint}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Precio mensual (€)</Text>
          <TextInput
            style={styles.input}
            value={priceEuros}
            onChangeText={setPriceEuros}
            placeholder="0 = gratis"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Déjalo en 0 para una comunidad gratuita. Si pones precio, el alta requiere pago.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ActionButton
          label={saving ? 'Creando…' : 'Crear comunidad'}
          onPress={onSubmit}
          disabled={saving || name.trim().length < 3}
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
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 15,
  },
  multiline: { minHeight: 96, paddingTop: spacing.sm, textAlignVertical: 'top' },
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
  error: { color: colors.danger, fontSize: 14 },
});
