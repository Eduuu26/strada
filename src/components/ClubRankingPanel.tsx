import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useClubRanking } from '../hooks/useClubRanking';
import {
  CLUB_RANKING_METRICS,
  formatRankingDetail,
  formatRankingStat,
  metricLabel,
} from '../lib/clubRanking';
import { routeVehicleModeLabel } from '../lib/routeVehicles';
import { colors, radius, spacing } from '../theme';

function rankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

type Props = {
  limit?: number;
};

export function ClubRankingPanel({ limit = 8 }: Props) {
  const router = useRouter();
  const { metric, setMetric, ranking } = useClubRanking(limit);

  if (!ranking.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking de clubes</Text>
        <Text style={styles.subtitle}>
          Por {metricLabel(metric).toLowerCase()}: miembros, rutas, quedadas e interacción en chat.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CLUB_RANKING_METRICS.map((option) => {
          const active = option.id === metric;
          return (
            <Pressable
              key={option.id}
              onPress={() => setMetric(option.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {ranking.map((row) => (
          <Pressable
            key={row.club.id}
            style={styles.row}
            onPress={() => router.push(`/club/${row.club.id}`)}
          >
            <Text style={styles.rank}>{rankBadge(row.rank)}</Text>
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.clubName} numberOfLines={1}>
                  {row.club.name}
                </Text>
                <Text style={styles.stat}>{formatRankingStat(row, metric)}</Text>
              </View>
              <Text style={styles.detail} numberOfLines={2}>
                {row.club.locationLabel ? `${row.club.locationLabel} · ` : ''}
                {routeVehicleModeLabel(row.club.vehicleMode)} · {formatRankingDetail(row, metric)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
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
  header: { gap: 4 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.text, fontWeight: '700' },
  list: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: { fontSize: 18, width: 36, textAlign: 'center', marginTop: 2 },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  clubName: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  stat: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  detail: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
