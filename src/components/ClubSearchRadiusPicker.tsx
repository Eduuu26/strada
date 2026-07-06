import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import {
  CLUB_SEARCH_RADIUS_OPTIONS,
  type ClubSearchRadiusId,
} from '../lib/clubSearchRadius';
import { colors, radius, spacing } from '../theme';

type Props = {
  value: ClubSearchRadiusId;
  onChange: (id: ClubSearchRadiusId) => void;
};

export function ClubSearchRadiusPicker({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CLUB_SEARCH_RADIUS_OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.text, fontWeight: '700' },
});
