import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { cardStyle, colors, fonts, radius, spacing } from '../theme';

type Props = {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.illustration}>
        {icon ? (
          <Text style={styles.iconEmoji}>{icon}</Text>
        ) : (
          <View style={styles.illustrationInner} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <ActionButton label={secondaryLabel} variant="secondary" onPress={onSecondary} style={styles.btn} />
      ) : null}
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    ...cardStyle,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  illustration: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  illustrationInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.7,
  },
  iconEmoji: { fontSize: 28 },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
    ...font,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
    ...font,
  },
  btn: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
