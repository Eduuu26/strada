import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SmartImage } from './SmartImage';
import { routeVehicleModeIcon, routeVehicleModeLabel } from '../lib/routeVehicles';
import type { RouteVehicleMode } from '../types';
import { cardStyle, colors, fonts, radius, spacing } from '../theme';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  coverImage?: string;
  creatorName?: string;
  vehicleMode?: RouteVehicleMode;
  tags?: string[];
  statusLabel?: string;
  dimmed?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function RouteCard({
  title,
  subtitle,
  meta,
  coverImage,
  creatorName,
  vehicleMode,
  tags,
  statusLabel,
  dimmed,
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        dimmed && styles.dimmed,
        pressed && styles.pressed,
        style,
      ]}
      disabled={!onPress}
    >
      <SmartImage uri={coverImage || DEFAULT_COVER} style={styles.cover} fallbackIcon="🗺️" />
      {vehicleMode ? (
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>
            {routeVehicleModeIcon(vehicleMode)} {routeVehicleModeLabel(vehicleMode)}
          </Text>
        </View>
      ) : null}
      <View style={styles.body}>
        {creatorName ? (
          <View style={styles.creatorRow}>
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorInitials}>
                {creatorName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <Text style={styles.creatorText}>
              Por <Text style={styles.creatorName}>{creatorName}</Text>
            </Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </View>
        ) : meta ? (
          <Text style={styles.metaOnly}>{meta}</Text>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {tags && tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {statusLabel ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  dimmed: { opacity: 0.72 },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 260,
    backgroundColor: colors.surfaceElevated,
  },
  modeBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.mapOverlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  modeBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  creatorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitials: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  creatorText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
    ...(fonts.family ? { fontFamily: fonts.family } : {}),
  },
  creatorName: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  metaOnly: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.3,
    ...(fonts.family ? { fontFamily: fonts.family } : {}),
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    ...(fonts.family ? { fontFamily: fonts.family } : {}),
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusPillText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
});
