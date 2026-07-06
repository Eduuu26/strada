import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SOCIAL_NETWORKS, formatSocialDisplay, socialProfileUrl } from '../lib/socials';
import type { UserSocials } from '../types';
import { colors, radius, spacing } from '../theme';

function openExternal(url: string) {
  if (Platform.OS === 'web') {
    // En web abrimos en una pestaña nueva para no sacar al usuario de la app.
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  void Linking.openURL(url);
}

const ICONS: Record<string, string> = {
  instagram: '📸',
  tiktok: '🎵',
  x: '𝕏',
  youtube: '▶️',
};

type Props = {
  socials?: UserSocials;
  emptyText?: string;
};

/**
 * Muestra las redes sociales de un usuario como enlaces directos. Al pulsar
 * cada uno se abre el perfil real en la red (instagram.com/usuario, etc.).
 */
export function ProfileSocialLinks({ socials, emptyText = 'Este usuario no ha añadido redes.' }: Props) {
  const items = SOCIAL_NETWORKS.map((network) => {
    const handle = socials?.[network.id] ?? '';
    const url = socialProfileUrl(network.id, handle);
    if (!url) return null;
    return {
      id: network.id,
      label: network.label,
      display: formatSocialDisplay(network.id, handle),
      url,
    };
  }).filter((item): item is { id: string; label: string; display: string; url: string } => item !== null);

  if (!items.length) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => openExternal(item.url)}
        >
          <Text style={styles.icon}>{ICONS[item.id] ?? '🔗'}</Text>
          <View style={styles.body}>
            <Text style={styles.network}>{item.label}</Text>
            <Text style={styles.handle} numberOfLines={1}>
              {item.display}
            </Text>
          </View>
          <Text style={styles.open}>Abrir →</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowPressed: { opacity: 0.7, borderColor: colors.accent },
  icon: { fontSize: 20, width: 26, textAlign: 'center' },
  body: { flex: 1 },
  network: { color: colors.text, fontSize: 14, fontWeight: '700' },
  handle: { color: colors.textMuted, fontSize: 13 },
  open: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
