import { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProfileAvatar } from './ProfileAvatar';
import { SmartImage } from './SmartImage';
import { vehicleDisplayMeta, vehicleDisplayTitle, vehiclePhotoUrl } from '../data/vehicles';
import type { CarMatchCard } from '../types';
import { colors, radius, spacing } from '../theme';

const SWIPE_THRESHOLD = 110;

type Props = {
  card: CarMatchCard;
  onSwipe: (direction: 'like' | 'pass') => void;
  onOpenProfile?: (email: string) => void;
  style?: ViewStyle;
  /** Tarjeta de fondo en el mazo: sin gestos ni botones. */
  preview?: boolean;
};

export function SwipeCarCard({ card, onSwipe, onOpenProfile, style, preview = false }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const exiting = useRef(false);

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  function finish(direction: 'like' | 'pass') {
    if (exiting.current) return;
    exiting.current = true;
    const toX = direction === 'like' ? 420 : -420;
    Animated.timing(pan, {
      toValue: { x: toX, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => onSwipe(direction));
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) finish('like');
        else if (g.dx < -SWIPE_THRESHOLD) finish('pass');
        else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const vehicleType = card.vehicle.type === 'moto' ? 'Moto' : 'Coche';

  if (preview) {
    return (
      <View style={[styles.card, styles.previewCard, style]}>
        <SmartImage uri={vehiclePhotoUrl(card.vehicle)} style={styles.photo} />
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{vehicleType}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.card, style, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
      {...panResponder.panHandlers}
    >
      <SmartImage uri={vehiclePhotoUrl(card.vehicle)} style={styles.photo} />

      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{vehicleType}</Text>
      </View>

      <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
        <Text style={styles.stampLikeText}>ME GUSTA</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
        <Text style={styles.stampPassText}>PASO</Text>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          style={styles.ownerRow}
          onPress={() => onOpenProfile?.(card.ownerEmail)}
          disabled={!onOpenProfile}
        >
          <ProfileAvatar name={card.ownerName} avatarUrl={card.ownerAvatarUrl} size={36} />
          <View style={styles.ownerText}>
            <Text style={styles.ownerName}>{card.ownerName}</Text>
            <Text style={styles.vehicleTitle}>{vehicleDisplayTitle(card.vehicle)}</Text>
            <Text style={styles.vehicleMeta}>{vehicleDisplayMeta(card.vehicle)}</Text>
          </View>
          {onOpenProfile ? <Text style={styles.viewProfile}>Ver perfil →</Text> : null}
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.passBtn]}
          onPress={() => finish('pass')}
          accessibilityLabel="Pasar"
        >
          <Feather name="x" size={28} color={colors.danger} />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={() => finish('like')}
          accessibilityLabel="Me gusta"
        >
          <Feather name="heart" size={26} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewCard: {
    transform: [{ scale: 0.96 }],
    opacity: 0.55,
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(13,17,23,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBadgeText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  photo: {
    width: '100%',
    flex: 1,
    minHeight: 320,
  },
  stamp: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 3,
    borderRadius: radius.sm,
  },
  stampLike: {
    left: spacing.lg,
    borderColor: '#2ecc71',
    transform: [{ rotate: '-12deg' }],
  },
  stampPass: {
    right: spacing.lg,
    borderColor: colors.danger,
    transform: [{ rotate: '12deg' }],
  },
  stampLikeText: { color: '#2ecc71', fontWeight: '800', fontSize: 22, letterSpacing: 1 },
  stampPassText: { color: colors.danger, fontWeight: '800', fontSize: 22, letterSpacing: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 72,
    padding: spacing.md,
    backgroundColor: 'rgba(13,17,23,0.88)',
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerText: { flex: 1, gap: 2 },
  ownerName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  viewProfile: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  vehicleTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  vehicleMeta: { color: colors.textMuted, fontSize: 13 },
  actions: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  passBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  likeBtn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
