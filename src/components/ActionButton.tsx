import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
};

export function ActionButton({ label, variant = 'primary', style, ...props }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.accent,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
    ...font,
  },
  labelPrimary: {
    color: '#fff',
  },
  labelSecondary: {
    color: colors.text,
  },
  labelGhost: {
    color: colors.accent,
  },
});
