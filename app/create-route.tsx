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
import { CoverPhotoField } from '../src/components/CoverPhotoField';
import { DateTimeField } from '../src/components/DateTimeField';
import { ScreenHero } from '../src/components/ScreenHero';
import { SectionTitle } from '../src/components/SectionTitle';
import { useAuth } from '../src/context/AuthContext';
import { useRoutes } from '../src/context/RoutesContext';
import type { JoinMode, RouteDifficulty, RouteVehicleMode } from '../src/types';
import { ROUTE_DIFFICULTIES, ROUTE_VEHICLE_MODES } from '../src/lib/routeVehicles';
import { parseUserDateToISO, formatDateTimeLocal } from '../src/lib/datetime';
import { isSupabaseConfigured } from '../src/lib/env';
import { uploadUserImage } from '../src/lib/supabase/storageRepository';
import { colors, radius, spacing } from '../src/theme';

const DIFFICULTIES = ROUTE_DIFFICULTIES.filter((d) => d.id !== 'all');

function defaultMeetingAt(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 48);
  return formatDateTimeLocal(d);
}

export default function CreateRouteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createRoute } = useRoutes();
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [description, setDescription] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [difficulty, setDifficulty] = useState<RouteDifficulty>('media');
  const [vehicleMode, setVehicleMode] = useState<RouteVehicleMode>('mixto');
  const [stopsText, setStopsText] = useState('');
  const [meetingAt, setMeetingAt] = useState(defaultMeetingAt);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [joinMode, setJoinMode] = useState<JoinMode>('open');
  const [coverImage, setCoverImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.error}>Debes iniciar sesión para crear una ruta.</Text>
          <ActionButton label="Iniciar sesión" onPress={() => router.push('/login?redirect=/create-route')} />
        </View>
      </SafeAreaView>
    );
  }

  const authedUser = user;

  async function handleCreate() {
    const km = Number(distanceKm);
    const mins = Number(durationMin);
    const max = Number(maxAttendees);
    if (!title.trim() || !region.trim() || !description.trim() || !meetingPoint.trim()) {
      setError('Completa los campos obligatorios.');
      return;
    }
    if (!coverImage.trim()) {
      setError('Sube una foto de previsualización de la ruta.');
      return;
    }
    if (!stopsText.trim()) {
      setError('Añade al menos una parada (una por línea).');
      return;
    }
    if (!meetingAt.trim()) {
      setError('Indica fecha y hora de la quedada.');
      return;
    }
    const meetingIso = parseUserDateToISO(meetingAt);
    if (!meetingIso) {
      setError('La fecha y hora no son válidas.');
      return;
    }
    if (!Number.isFinite(km) || km <= 0 || !Number.isFinite(mins) || mins <= 0) {
      setError('Distancia y duración deben ser números válidos.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let imageUrl = coverImage;
      if (isSupabaseConfigured() && authedUser.id) {
        imageUrl = await uploadUserImage(authedUser.id, 'routes', coverImage);
      }
      const route = createRoute(
        {
          title,
          region,
          province,
          description,
          distanceKm: km,
          durationMin: mins,
          difficulty,
          vehicleMode,
          stopsText,
          meetingAt: meetingIso,
          meetingPoint,
          maxAttendees: Number.isFinite(max) && max > 0 ? max : 20,
          joinMode,
          coverImage: imageUrl,
        },
        { email: authedUser.email, name: authedUser.name },
      );
      router.replace(`/route/${route.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar la ruta.');
    } finally {
      setSubmitting(false);
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
            kicker="Nueva ruta"
            title="Publicar ruta"
            subtitle="Indica si la ruta es para coches, motos o ambos. Los apuntados elegirán su vehículo del garaje."
          />

          <SectionTitle>Información básica</SectionTitle>
          <Field label="Título *" value={title} onChangeText={setTitle} placeholder="Ej. Curvas del Montseny" />
          <Field label="Comunidad autónoma *" value={region} onChangeText={setRegion} placeholder="Ej. Cataluña" />
          <Field label="Provincia" value={province} onChangeText={setProvince} placeholder="Ej. Barcelona" />
          <Field
            label="Descripción *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe la ruta…"
            multiline
          />
          <Field label="Distancia (km) *" value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />
          <Field label="Duración (min) *" value={durationMin} onChangeText={setDurationMin} keyboardType="numeric" />

          <SectionTitle>Características</SectionTitle>
          <Text style={styles.label}>Tipo de ruta</Text>
          <View style={styles.chips}>
            {ROUTE_VEHICLE_MODES.map((mode) => (
              <ActionButton
                key={mode.id}
                label={`${mode.icon} ${mode.label}`}
                variant={vehicleMode === mode.id ? 'primary' : 'secondary'}
                onPress={() => setVehicleMode(mode.id)}
                style={styles.chipWide}
              />
            ))}
          </View>

          <Text style={styles.label}>Dificultad</Text>
          <View style={styles.chips}>
            {DIFFICULTIES.map((level) => (
              <ActionButton
                key={level.id}
                label={level.label}
                variant={difficulty === level.id ? 'primary' : 'secondary'}
                onPress={() => setDifficulty(level.id as RouteDifficulty)}
                style={styles.chip}
              />
            ))}
          </View>

          <SectionTitle>Ruta y encuentro</SectionTitle>
          <Field
            label="Paradas (una por línea) *"
            value={stopsText}
            onChangeText={(text) => {
              setStopsText(text);
              const first = text.split('\n').map((l) => l.trim()).find(Boolean);
              if (first && !meetingPoint.trim()) setMeetingPoint(first);
            }}
            placeholder={'Punto de salida\nMirador\nDestino'}
            multiline
          />
          <CoverPhotoField value={coverImage} onChange={setCoverImage} />
          <DateTimeField label="Fecha y hora quedada *" value={meetingAt} onChange={setMeetingAt} />
          <Field label="Punto de encuentro *" value={meetingPoint} onChangeText={setMeetingPoint} placeholder="Dirección o referencia" />
          <Field label="Plazas máximas" value={maxAttendees} onChangeText={setMaxAttendees} keyboardType="numeric" />

          <Text style={styles.label}>Acceso a la ruta</Text>
          <View style={styles.chips}>
            <ActionButton
              label="🌐 Abierta"
              variant={joinMode === 'open' ? 'primary' : 'secondary'}
              onPress={() => setJoinMode('open')}
              style={styles.chipWide}
            />
            <ActionButton
              label="🔒 Privada"
              variant={joinMode === 'request' ? 'primary' : 'secondary'}
              onPress={() => setJoinMode('request')}
              style={styles.chipWide}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <ActionButton
            label={submitting ? 'Publicando…' : 'Publicar ruta'}
            onPress={handleCreate}
            disabled={submitting}
          />
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
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  field: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    fontSize: 16,
  },
  inputMulti: { minHeight: 100, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flex: 1, minWidth: 90 },
  chipWide: { flex: 1, minWidth: '100%' },
  error: { color: colors.danger, fontSize: 14 },
});
