import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import {
  VEHICLE_OPTIONS,
  validateVehicleInput,
  vehicleFromFormInput,
} from '../data/vehicles';
import { getCatalogBrands } from '../data/vehicleCatalog';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/env';
import { pickVehiclePhotoFromLibrary, takeVehiclePhoto } from '../lib/pickVehiclePhoto';
import { validateVehiclePhoto } from '../lib/security/vehiclePhotoValidation';
import { uploadUserImage } from '../lib/supabase/storageRepository';
import type { UserVehicle, VehicleFormInput, VehicleType } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  vehicle?: UserVehicle | null;
  onClose: () => void;
  onSave: (input: VehicleFormInput) => void;
};

export function VehicleFormModal({ visible, vehicle, onClose, onSave }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState<VehicleType>('coche');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(vehicle?.type ?? 'coche');
      setBrand(vehicle?.brand ?? '');
      setModel(vehicle?.model ?? '');
      setYear(vehicle?.year ? String(vehicle.year) : '');
      setPhotoUrl(vehicle?.photoUrl ?? '');
      setError('');
      setPicking(false);
      setSaving(false);
    } else {
      setPicking(false);
      setSaving(false);
    }
  }, [visible, vehicle]);

  function handleClose() {
    setPicking(false);
    onClose();
  }

  async function handlePickFromLibrary() {
    setPicking(true);
    setError('');
    try {
      const url = await pickVehiclePhotoFromLibrary();
      if (url) {
        const photoError = await validateVehiclePhoto(url, type);
        if (photoError) {
          setError(photoError);
          return;
        }
        setPhotoUrl(url);
      } else if (Platform.OS !== 'web') {
        setError('Necesitamos acceso a tus fotos para subir la imagen del vehículo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo usar la imagen.');
    } finally {
      setPicking(false);
    }
  }

  async function handleTakePhoto() {
    setPicking(true);
    setError('');
    try {
      const url = await takeVehiclePhoto();
      if (url) {
        const photoError = await validateVehiclePhoto(url, type);
        if (photoError) {
          setError(photoError);
          return;
        }
        setPhotoUrl(url);
      } else setError('No se pudo acceder a la cámara. Revisa los permisos.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo usar la imagen.');
    } finally {
      setPicking(false);
    }
  }

  async function handleSave() {
    const validationError = validateVehicleInput(type, brand, model, year, photoUrl);
    if (validationError) {
      setError(validationError);
      return;
    }
    const photoError = await validateVehiclePhoto(photoUrl, type);
    if (photoError) {
      setError(photoError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      let finalPhoto = photoUrl.trim();
      if (user?.id && isSupabaseConfigured()) {
        finalPhoto = await uploadUserImage(user.id, 'vehicles', finalPhoto);
      }
      onSave(
        vehicleFromFormInput({
          type,
          brand,
          model,
          year: Number(year),
          photoUrl: finalPhoto,
        }),
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el vehículo.');
    } finally {
      setSaving(false);
    }
  }

  const maxYear = new Date().getFullYear() + 1;
  const brandExamples = getCatalogBrands(type).slice(0, 6).join(', ');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.sheet}>
          <Text style={styles.title}>{vehicle ? 'Editar vehículo' : 'Añadir vehículo'}</Text>
          <Text style={styles.subtitle}>
            Indica si es coche o moto, los datos del modelo y sube una foto. Marca y modelo deben ser reales
            (ej. {brandExamples}…). Máx. 6 MB.
          </Text>

          <Text style={styles.label}>Tipo de vehículo *</Text>
          <View style={styles.typeRow}>
            {VEHICLE_OPTIONS.map((option) => {
              const active = type === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setType(option.id)}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                >
                  <Text style={styles.chipIcon}>{option.icon}</Text>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Marca *</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Ej. Seat, Yamaha, BMW…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Modelo *</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Ej. León, MT-07, Serie 3…"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Año *</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder={`Ej. 2020 (1950–${maxYear})`}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
          />

          <Text style={styles.label}>Foto del vehículo *</Text>
          <Text style={styles.photoHint}>
            Obligatoria. Sube al menos una foto de tu coche o moto para mostrarla en tu perfil y club.
          </Text>

          {photoUrl ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUrl }} style={styles.preview} resizeMode="cover" />
              <Pressable onPress={() => setPhotoUrl('')} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>Quitar foto</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>Aún no has subido ninguna foto</Text>
            </View>
          )}

          <View style={styles.photoActions}>
            <ActionButton
              label={picking ? 'Abriendo…' : 'Subir desde galería'}
              variant="secondary"
              onPress={handlePickFromLibrary}
              disabled={picking}
            />
            {Platform.OS !== 'web' ? (
              <ActionButton
                label="Hacer foto"
                variant="secondary"
                onPress={handleTakePhoto}
                disabled={picking}
              />
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <ActionButton
              label={saving ? 'Guardando…' : vehicle ? 'Guardar cambios' : 'Añadir vehículo'}
              onPress={handleSave}
              disabled={picking || saving}
            />
            <ActionButton label="Cancelar" variant="ghost" onPress={handleClose} />
          </View>
        </ScrollView>
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
  scroll: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { borderColor: colors.text, backgroundColor: colors.surfaceElevated },
  chipIcon: { fontSize: 28, marginBottom: 6 },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: colors.text },
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
  error: { color: colors.danger, fontSize: 14 },
  photoHint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.xs },
  previewWrap: { gap: spacing.xs },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  removePhoto: { alignSelf: 'flex-start' },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPlaceholderIcon: { fontSize: 32 },
  photoPlaceholderText: { color: colors.textMuted, fontSize: 13 },
  photoActions: { gap: spacing.sm, marginTop: spacing.xs },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
});
