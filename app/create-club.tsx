import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../src/components/ActionButton';
import { ScreenHero } from '../src/components/ScreenHero';
import { SectionTitle } from '../src/components/SectionTitle';
import { getCurrentCoords } from '../src/hooks/useUserLocation';
import { useAuth } from '../src/context/AuthContext';
import { useClubs } from '../src/context/ClubsContext';
import { ROUTE_VEHICLE_MODES } from '../src/lib/routeVehicles';
import type { RouteVehicleMode } from '../src/types';
import { colors, radius, spacing } from '../src/theme';

const STEPS = [
  'Completa nombre, descripción y zona del club.',
  'Envía la solicitud al equipo de Strada.',
  'Recibirás una notificación cuando el club esté aprobado.',
];

export default function CreateClubScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { submitClubCreationRequest } = useClubs();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [vehicleMode, setVehicleMode] = useState<RouteVehicleMode>('mixto');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.error}>Debes iniciar sesión para crear un club.</Text>
          <ActionButton label="Iniciar sesión" onPress={() => router.push('/login?redirect=/create-club')} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleCreate() {
    if (!name.trim() || !description.trim()) {
      setError('Completa nombre y descripción del club.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const coords = await getCurrentCoords();
      const result = submitClubCreationRequest(
        {
          name,
          description,
          vehicleMode,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationLabel: locationLabel.trim() || 'Tu zona',
        },
        { email: user.email, name: user.name },
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/(tabs)/clubs');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHero
            kicker="Nuevo club"
            title="Solicitar club"
            subtitle="Envía tu petición al equipo de Strada. La revisaremos y te notificaremos cuando el club esté creado."
          />

          <View style={styles.stepsBox}>
            <Text style={styles.stepsTitle}>Cómo funciona</Text>
            {STEPS.map((step, i) => (
              <Text key={step} style={styles.stepItem}>
                {i + 1}. {step}
              </Text>
            ))}
          </View>

          <SectionTitle>Datos del club</SectionTitle>
          <Field label="Nombre del club *" value={name} onChangeText={setName} placeholder="Ej. Madrid Sport Drivers" />
          <Field
            label="Descripción *"
            value={description}
            onChangeText={setDescription}
            placeholder="Qué tipo de salidas hacéis, zona, ritmo…"
            multiline
          />
          <Field
            label="Zona o ciudad"
            value={locationLabel}
            onChangeText={setLocationLabel}
            placeholder="Ej. Madrid, Costa Brava…"
          />

          <Text style={styles.label}>Tipo de vehículos</Text>
          <View style={styles.chips}>
            {ROUTE_VEHICLE_MODES.map((mode) => (
              <ActionButton
                key={mode.id}
                label={`${mode.icon} ${mode.label}`}
                variant={vehicleMode === mode.id ? 'primary' : 'secondary'}
                onPress={() => setVehicleMode(mode.id)}
                style={styles.chip}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <ActionButton label={creating ? 'Enviando…' : 'Enviar solicitud'} onPress={handleCreate} disabled={creating} />
          <ActionButton label="Cancelar" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stepsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  stepsTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: spacing.xs },
  stepItem: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  field: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexGrow: 1, minWidth: '45%' },
  error: { color: colors.danger, fontSize: 14 },
});
