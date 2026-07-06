import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  pills?: (string | null | undefined | false)[];
  style?: ViewStyle;
};

export function ScreenHero({ kicker, title, subtitle, pills, style }: Props) {
  const visiblePills = (pills ?? []).filter((p): p is string => !!p);
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.accentBar} />
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {visiblePills.length ? (
        <View style={styles.pills}>
          {visiblePills.map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerLine,
  },
  accentBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: spacing.xs,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: typography.kicker.fontSize,
    fontWeight: typography.kicker.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: typography.kicker.letterSpacing,
    ...font,
  },
  title: {
    color: colors.text,
    fontSize: typography.hero.fontSize,
    fontWeight: typography.hero.fontWeight,
    lineHeight: typography.hero.lineHeight,
    letterSpacing: typography.hero.letterSpacing,
    ...font,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    maxWidth: 520,
    ...font,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pill: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    ...font,
  },
});
