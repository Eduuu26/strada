import { useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/env';
import { pickVehiclePhotoFromLibrary } from '../lib/pickVehiclePhoto';
import { uploadUserImage } from '../lib/supabase/storageRepository';
import { colors, radius, spacing } from '../theme';

const AVATAR_PRESETS = [
  {
    id: 'a1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    label: 'Conductor 1',
  },
  {
    id: 'a2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    label: 'Conductora',
  },
  {
    id: 'a3',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    label: 'Conductor 2',
  },
  {
    id: 'a4',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    label: 'Conductora 2',
  },
];

type Props = {
  visible: boolean;
  currentUrl?: string;
  onClose: () => void;
  onSelect: (url: string) => void;
  onRemove: () => void;
};

export function AvatarPickerModal({ visible, currentUrl, onClose, onSelect, onRemove }: Props) {
  const { user } = useAuth();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');

  async function handlePickFromLibrary() {
    setPicking(true);
    setError('');
    try {
      const url = await pickVehiclePhotoFromLibrary();
      if (!url) return;
      let finalUrl = url;
      if (user?.id && isSupabaseConfigured()) {
        finalUrl = await uploadUserImage(user.id, 'avatars', url);
      }
      onSelect(finalUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
    } finally {
      setPicking(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Foto de perfil</Text>
          <Text style={styles.subtitle}>Elige una imagen o sube la tuya.</Text>

          <ActionButton
            label={picking ? 'Abriendo…' : 'Subir desde galería'}
            variant="secondary"
            onPress={handlePickFromLibrary}
            disabled={picking}
          />

          <View style={styles.grid}>
            {AVATAR_PRESETS.map((preset) => {
              const active = currentUrl === preset.url;
              return (
                <Pressable
                  key={preset.id}
                  style={[styles.preset, active && styles.presetActive]}
                  onPress={() => {
                    onSelect(preset.url);
                    onClose();
                  }}
                >
                  <Image source={{ uri: preset.url }} style={styles.presetImage} />
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {currentUrl ? (
            <ActionButton
              label="Quitar foto"
              variant="secondary"
              onPress={() => {
                onRemove();
                onClose();
              }}
            />
          ) : null}
          <ActionButton label="Cancelar" variant="ghost" onPress={onClose} />
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
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  presetActive: { borderColor: colors.accent },
  presetImage: { width: '100%', aspectRatio: 1 },
  presetLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    padding: 8,
    textAlign: 'center',
  },
  error: { color: colors.danger, fontSize: 13 },
});
