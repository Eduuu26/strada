import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  name: string;
  avatarUrl?: string;
  size?: number;
  onPress?: () => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfileAvatar({ name, avatarUrl, size = 56, onPress }: Props) {
  const radius = size / 2;

  const content = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: radius }} />
  ) : (
    <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.accent,
    fontWeight: '800',
  },
});
