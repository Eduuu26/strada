import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { SearchBar } from '../src/components/SearchBar';
import { SectionTitle } from '../src/components/SectionTitle';
import { useAuth } from '../src/context/AuthContext';
import { useRoutes } from '../src/context/RoutesContext';
import { ROUTE_VEHICLE_MODES } from '../src/lib/routeVehicles';
import { parseUserDateToISO, formatDateTimeLocal } from '../src/lib/datetime';
import { isSupabaseConfigured } from '../src/lib/env';
import { uploadUserImage } from '../src/lib/supabase/storageRepository';
import type { JoinMode, RouteVehicleMode } from '../src/types';
import { colors, radius, spacing } from '../src/theme';

function defaultMeetingAt(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 48);
  return formatDateTimeLocal(d);
}

export default function CreateMeetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { routes, createMeetup } = useRoutes();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [routeId, setRouteId] = useState('');
  const [routeQuery, setRouteQuery] = useState('');
  const [vehicleMode, setVehicleMode] = useState<RouteVehicleMode>('mixto');
  const [meetingAt, setMeetingAt] = useState(defaultMeetingAt);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [joinMode, setJoinMode] = useState<JoinMode>('open');
  const [coverImage, setCoverImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredRoutes = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        r.province.toLowerCase().includes(q),
    );
  }, [routes, routeQuery]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.error}>Debes iniciar sesión para organizar una quedada.</Text>
          <ActionButton label="Iniciar sesión" onPress={() => router.push('/login?redirect=/create-meetup')} />
        </View>
      </SafeAreaView>
    );
  }

  const authedUser = user;

  function selectRoute(id: string) {
    setRouteId(id);
    if (!id) return;
    const route = routes.find((r) => r.id === id);
    if (!route) return;
    if (route.meetingPoint) setMeetingPoint(route.meetingPoint);
    if (route.vehicleMode) setVehicleMode(route.vehicleMode);
    if (route.coverImage && !coverImage.trim()) setCoverImage(route.coverImage);
    if (route.meetingAt && !title.trim()) {
      setTitle(`Quedada — ${route.title}`);
    }
  }

  async function handleCreate() {
    const max = Number(maxAttendees);
    if (!title.trim() || !description.trim() || !meetingPoint.trim()) {
      setError('Completa los campos obligatorios.');
      return;
    }
    if (!coverImage.trim()) {
      setError('Sube una foto de previsualización de la quedada.');
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

    setSubmitting(true);
    setError('');
    try {
      let imageUrl = coverImage;
      if (isSupabaseConfigured() && authedUser.id) {
        imageUrl = await uploadUserImage(authedUser.id, 'meetups', coverImage);
      }
      const meetup = createMeetup(
        {
          title,
          description,
          routeId: routeId || undefined,
          meetingAt: meetingIso,
          meetingPoint,
          maxAttendees: Number.isFinite(max) && max > 0 ? max : 20,
          vehicleMode,
          joinMode,
          coverImage: imageUrl,
        },
        { email: authedUser.email, name: authedUser.name },
      );
      router.replace(`/meetup/${meetup.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar la quedada.');
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
            kicker="Nueva quedada"
            title="Organizar quedada"
            subtitle="Publica fecha, punto de encuentro y plazas. Puedes vincular una ruta o hacerla independiente."
          />

          <SectionTitle>Detalles</SectionTitle>
          <Field label="Título *" value={title} onChangeText={setTitle} placeholder="Ej. Salida dominical por la sierra" />
          <Field
            label="Descripción *"
            value={description}
            onChangeText={setDescription}
            placeholder="Qué haréis, ritmo, paradas…"
            multiline
          />

          <SectionTitle>Ruta vinculada (opcional)</SectionTitle>
          <SearchBar
            value={routeQuery}
            onChangeText={setRouteQuery}
            placeholder="Buscar ruta por nombre o región…"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routeScroll}>
            <Pressable
              style={[styles.routePill, !routeId && styles.routePillActive]}
              onPress={() => selectRoute('')}
            >
              <Text style={[styles.routePillText, !routeId && styles.routePillTextActive]}>Sin ruta</Text>
            </Pressable>
            {filteredRoutes.map((route) => {
              const active = routeId === route.id;
              return (
                <Pressable
                  key={route.id}
                  style={[styles.routePill, active && styles.routePillActive]}
                  onPress={() => selectRoute(route.id)}
                >
                  <Text style={[styles.routePillText, active && styles.routePillTextActive]} numberOfLines={1}>
                    {route.title}
                  </Text>
                  <Text style={styles.routePillMeta}>{route.region}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {routeId ? (
            <Text style={styles.routeHint}>
              Se copiarán punto de encuentro y tipo de vehículo de la ruta seleccionada.
            </Text>
          ) : null}

          <SectionTitle>Vehículos y acceso</SectionTitle>
          <Text style={styles.label}>Tipo de vehículos</Text>
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

          <CoverPhotoField
            label="Foto de la quedada *"
            hint="Obligatoria. Sube una foto real de la quedada o del punto de encuentro."
            value={coverImage}
            onChange={setCoverImage}
          />
          <DateTimeField label="Fecha y hora *" value={meetingAt} onChange={setMeetingAt} />
          <Field
            label="Punto de encuentro *"
            value={meetingPoint}
            onChangeText={setMeetingPoint}
            placeholder="Dirección o referencia"
          />
          <Field label="Plazas máximas" value={maxAttendees} onChangeText={setMaxAttendees} keyboardType="numeric" />

          <Text style={styles.label}>Acceso a la quedada</Text>
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
            label={submitting ? 'Publicando…' : 'Publicar quedada'}
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
  chipWide: { flex: 1, minWidth: '100%' },
  routeScroll: { gap: spacing.sm, paddingVertical: spacing.xs },
  routePill: {
    maxWidth: 200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  routePillActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  routePillText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  routePillTextActive: { color: colors.accent },
  routePillMeta: { color: colors.textMuted, fontSize: 11 },
  routeHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 14 },
});
