import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, inputStyle, spacing, typography } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  /** Muestra un botón ojo: mientras lo mantienes pulsado se ve la contraseña. */
  holdToRevealPassword?: boolean;
};

export function FormField({ label, error, style, holdToRevealPassword, secureTextEntry, ...props }: Props) {
  const [revealed, setRevealed] = useState(false);
  const isSecure = secureTextEntry && !revealed;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            holdToRevealPassword && styles.inputWithToggle,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          {...props}
        />
        {holdToRevealPassword && secureTextEntry ? (
          <Pressable
            style={styles.revealBtn}
            onPressIn={() => setRevealed(true)}
            onPressOut={() => setRevealed(false)}
            accessibilityRole="button"
            accessibilityLabel="Mantén pulsado para ver la contraseña"
            hitSlop={8}
          >
            <Feather
              name={revealed ? 'eye-off' : 'eye'}
              size={20}
              color={revealed ? colors.accent : colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    color: colors.textSecondary,
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    letterSpacing: typography.label.letterSpacing,
    ...(fonts.family ? { fontFamily: fonts.family } : {}),
  },
  input: {
    ...inputStyle,
  },
  inputRow: {
    position: 'relative',
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  revealBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
