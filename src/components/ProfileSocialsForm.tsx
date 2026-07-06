import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { SOCIAL_NETWORKS } from '../lib/socials';
import type { UserSocials } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  value: UserSocials;
  onChange: (socials: UserSocials) => void;
  onSave: () => void;
};

export function ProfileSocialsForm({ value, onChange, onSave }: Props) {
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function setField(id: keyof UserSocials, text: string) {
    onChange({ ...value, [id]: text });
  }

  function handleSave() {
    onSave();
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Redes sociales</Text>
      <Text style={styles.hint}>Opcional. Comparte tus perfiles con la comunidad.</Text>
      {SOCIAL_NETWORKS.map((network) => (
        <View key={network.id} style={styles.field}>
          <Text style={styles.label}>{network.label}</Text>
          <View style={styles.inputRow}>
            {network.prefix ? <Text style={styles.prefix}>{network.prefix}</Text> : null}
            <TextInput
              style={styles.input}
              value={value[network.id]}
              onChangeText={(text) => setField(network.id, text)}
              placeholder={network.placeholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
      ))}
      <ActionButton
        label={saved ? 'Guardado ✓' : 'Guardar redes'}
        variant="secondary"
        onPress={handleSave}
        style={styles.saveBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.xs },
  field: { gap: 4 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prefix: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 15,
  },
  saveBtn: { marginTop: spacing.sm },
});
