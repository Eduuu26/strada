import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { pickVehiclePhotoFromLibrary, takeVehiclePhoto } from '../lib/pickVehiclePhoto';
import type { CreatePostInput, UserVehicle } from '../types';
import { vehicleDisplayTitle } from '../data/vehicles';
import { colors, cardStyle, radius, spacing } from '../theme';
import { ActionButton } from './ActionButton';
import { SmartImage } from './SmartImage';

type Props = {
  visible: boolean;
  authorName?: string;
  vehicles?: UserVehicle[];
  onClose: () => void;
  onSubmit: (input: CreatePostInput) => void | Promise<void>;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function CreatePostModal({ visible, authorName, vehicles, onClose, onSubmit }: Props) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [routeTitle, setRouteTitle] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState('');
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const displayName = authorName?.trim() || 'Tú';
  const meta = [vehicleLabel.trim(), routeTitle.trim()].filter(Boolean).join(' · ');

  function reset() {
    setImageUrl('');
    setCaption('');
    setRouteTitle('');
    setVehicleLabel('');
    setError('');
    setPicking(false);
    setPublishing(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePickFromLibrary() {
    setPicking(true);
    setError('');
    try {
      const url = await pickVehiclePhotoFromLibrary();
      if (url) setImageUrl(url);
      else if (Platform.OS !== 'web') {
        setError('Necesitamos acceso a tus fotos para publicar.');
      }
    } finally {
      setPicking(false);
    }
  }

  async function handleTakePhoto() {
    setPicking(true);
    setError('');
    try {
      const url = await takeVehiclePhoto();
      if (url) setImageUrl(url);
      else setError('No se pudo acceder a la cámara. Revisa los permisos.');
    } finally {
      setPicking(false);
    }
  }

  async function handleSubmit() {
    if (!imageUrl.trim()) {
      setError('Sube al menos una foto para publicar.');
      return;
    }
    if (!caption.trim()) {
      setError('Escribe una descripción.');
      return;
    }
    setPublishing(true);
    setError('');
    try {
      await onSubmit({
        imageUrl: imageUrl.trim(),
        caption,
        routeTitle: routeTitle || undefined,
        vehicleLabel: vehicleLabel || undefined,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Nueva publicación</Text>
            <Text style={styles.subtitle}>Comparte una foto de tu ruta, coche o moto.</Text>

            <Text style={styles.label}>Foto *</Text>
            <Text style={styles.photoHint}>Obligatoria. Sube una foto real de tu ruta o vehículo.</Text>

            {imageUrl ? (
              <Pressable onPress={() => setImageUrl('')} style={styles.removePhoto}>
                <Text style={styles.removePhotoText}>Quitar foto</Text>
              </Pressable>
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

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Cuéntanos la ruta, tu coche o moto, la experiencia…"
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
            />

            <Text style={styles.label}>Ruta (opcional)</Text>
            <TextInput
              style={styles.inputSingle}
              placeholder="Ej. Sierra de Madrid"
              placeholderTextColor={colors.textMuted}
              value={routeTitle}
              onChangeText={setRouteTitle}
            />

            <Text style={styles.label}>Vehículo (opcional)</Text>
            {vehicles?.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleChips}
              >
                {vehicles.map((vehicle) => {
                  const label = vehicleDisplayTitle(vehicle);
                  const active = vehicleLabel === label;
                  return (
                    <Pressable
                      key={vehicle.id}
                      style={[styles.vehicleChip, active && styles.vehicleChipActive]}
                      onPress={() => setVehicleLabel(active ? '' : label)}
                    >
                      <Text style={[styles.vehicleChipText, active && styles.vehicleChipTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            <TextInput
              style={styles.inputSingle}
              placeholder="Ej. BMW M2"
              placeholderTextColor={colors.textMuted}
              value={vehicleLabel}
              onChangeText={setVehicleLabel}
            />

            <Text style={styles.label}>Previsualización</Text>
            <Text style={styles.photoHint}>Así se verá tu publicación en el feed.</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>{getInitials(displayName)}</Text>
                </View>
                <View style={styles.previewAuthor}>
                  <Text style={styles.previewAuthorName}>{displayName}</Text>
                  {meta ? <Text style={styles.previewMeta}>{meta}</Text> : null}
                </View>
                <Text style={styles.previewTime}>ahora</Text>
              </View>

              {imageUrl ? (
                <SmartImage uri={imageUrl} style={styles.previewImage} fallbackIcon="📷" />
              ) : (
                <View style={styles.previewImagePlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.previewImagePlaceholderText}>Tu foto aparecerá aquí</Text>
                </View>
              )}

              {caption.trim() ? (
                <Text style={styles.previewCaption}>
                  <Text style={styles.previewCaptionAuthor}>{displayName} </Text>
                  {caption.trim()}
                </Text>
              ) : (
                <Text style={styles.previewCaptionEmpty}>La descripción aparecerá aquí…</Text>
              )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ActionButton label={publishing ? 'Publicando…' : 'Publicar'} onPress={handleSubmit} disabled={picking || publishing} />
            <ActionButton label="Cancelar" variant="secondary" onPress={handleClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
  },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  photoHint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.xs },
  removePhoto: { alignSelf: 'flex-start' },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    maxHeight: 120,
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
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputSingle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
  },
  vehicleChips: { gap: spacing.sm, paddingBottom: spacing.xs },
  vehicleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  vehicleChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  vehicleChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  vehicleChipTextActive: { color: colors.accent, fontWeight: '700' },
  previewCard: {
    ...cardStyle,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  previewAuthor: { flex: 1 },
  previewAuthorName: { color: colors.text, fontWeight: '700', fontSize: 14 },
  previewMeta: { color: colors.textMuted, fontSize: 12 },
  previewTime: { color: colors.textMuted, fontSize: 11 },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 220,
    backgroundColor: '#0a0e12',
  },
  previewImagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    maxHeight: 220,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  previewImagePlaceholderText: { color: colors.textMuted, fontSize: 13 },
  previewCaption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  previewCaptionAuthor: { fontWeight: '700' },
  previewCaptionEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { color: colors.danger, fontSize: 13 },
});
