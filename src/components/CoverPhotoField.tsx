import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { ActionButton } from './ActionButton';
import { pickVehiclePhotoFromLibrary, takeVehiclePhoto } from '../lib/pickVehiclePhoto';
import { colors, radius, spacing } from '../theme';

type Props = {
  label?: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
};

export function CoverPhotoField({
  label = 'Foto de previsualización *',
  hint = 'Obligatoria. Sube una foto real de la ruta o quedada.',
  value,
  onChange,
}: Props) {
  const [picking, setPicking] = useState(false);

  async function handlePickFromLibrary() {
    setPicking(true);
    try {
      const url = await pickVehiclePhotoFromLibrary();
      if (url) onChange(url);
    } finally {
      setPicking(false);
    }
  }

  async function handleTakePhoto() {
    setPicking(true);
    try {
      const url = await takeVehiclePhoto();
      if (url) onChange(url);
    } finally {
      setPicking(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>

      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
          <Pressable onPress={() => onChange('')} style={styles.removePhoto}>
            <Text style={styles.removePhotoText}>Quitar foto</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>Aún no has subido ninguna foto</Text>
        </View>
      )}

      <View style={styles.actions}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.xs },
  previewWrap: { gap: spacing.xs },
  preview: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  removePhoto: { alignSelf: 'flex-start' },
  removePhotoText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  placeholder: {
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderIcon: { fontSize: 32 },
  placeholderText: { color: colors.textMuted, fontSize: 13 },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
