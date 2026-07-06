import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { getSeedDirectoryEntry, getSeedPublicProfile } from '../data/seedProfiles';
import { colors, radius, spacing } from '../theme';

type Props = {
  title: string;
  emails: string[];
  emptyMessage: string;
  defaultExpanded?: boolean;
};

export function SocialConnectionsList({
  title,
  emails,
  emptyMessage,
  defaultExpanded = false,
}: Props) {
  const router = useRouter();
  const { getUserProfileByEmail } = useAuth();
  const { getConnectionLabel } = useSocial();
  const [expanded, setExpanded] = useState(defaultExpanded || emails.length <= 3);

  if (!emails.length) {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>{emptyMessage}</Text>
      </View>
    );
  }

  const visible = expanded ? emails : emails.slice(0, 3);

  return (
    <View style={styles.box}>
      <Pressable style={styles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.title}>
          {title} ({emails.length})
        </Text>
        <Text style={styles.toggle}>{expanded ? 'Ocultar' : 'Ver todos'}</Text>
      </Pressable>
      {visible.map((email) => {
        const profile = getUserProfileByEmail(email);
        const seed = getSeedPublicProfile(email);
        const name = profile?.name ?? seed?.name ?? getSeedDirectoryEntry(email)?.name ?? email;
        const avatarUrl = profile?.avatarUrl ?? seed?.avatarUrl;
        const label = getConnectionLabel(email);
        return (
          <Pressable
            key={email}
            style={styles.row}
            onPress={() => router.push(`/user/${encodeURIComponent(email)}`)}
          >
            <ProfileAvatar name={name} avatarUrl={avatarUrl} size={40} />
            <View style={styles.rowBody}>
              <Text style={styles.name}>{name}</Text>
              {label ? <Text style={styles.chip}>{label}</Text> : null}
            </View>
            <Text style={styles.link}>→</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  toggle: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  empty: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { color: colors.text, fontWeight: '600', fontSize: 14 },
  chip: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  link: { color: colors.textMuted, fontSize: 16 },
});
