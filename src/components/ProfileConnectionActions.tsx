import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import type { ProfileConnectionStatus } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  targetEmail: string;
  targetName: string;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  isSelf: boolean;
};

function statusLabel(status: ProfileConnectionStatus): string | null {
  switch (status) {
    case 'friend':
      return 'Amigos';
    case 'mutual_follow':
      return 'Os seguís';
    case 'following':
      return 'Siguiendo';
    case 'follower':
      return 'Te sigue';
    case 'request_sent':
      return 'Solicitud enviada';
    case 'request_received':
      return 'Quiere ser tu amigo';
    default:
      return null;
  }
}

export function ProfileConnectionActions({
  targetEmail,
  targetName,
  followerCount,
  followingCount,
  friendCount,
  isSelf,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    getConnectionStatus,
    follow,
    unfollow,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getPendingRequests,
    getIncomingRequestFrom,
    cancelFriendRequest,
  } = useSocial();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  if (isSelf) {
    const pending = getPendingRequests();
    return (
      <View style={styles.wrap}>
        <View style={styles.statsRow}>
          <Stat value={followerCount} label="Seguidores" />
          <Stat value={followingCount} label="Siguiendo" />
          <Stat value={friendCount} label="Amigos" />
        </View>
        {pending.length ? (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingTitle}>Solicitudes de amistad ({pending.length})</Text>
            {pending.slice(0, 5).map((req) => (
              <View key={req.id} style={styles.pendingRow}>
                <Pressable onPress={() => router.push(`/user/${encodeURIComponent(req.fromEmail)}`)}>
                  <Text style={styles.pendingName}>{req.fromName}</Text>
                </Pressable>
                <View style={styles.pendingActions}>
                  <Pressable style={styles.acceptBtn} onPress={() => acceptFriendRequest(req.id)}>
                    <Text style={styles.acceptText}>Aceptar</Text>
                  </Pressable>
                  <Pressable onPress={() => rejectFriendRequest(req.id)}>
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const status = getConnectionStatus(targetEmail);
  const badge = statusLabel(status);
  const incoming = getIncomingRequestFrom(targetEmail);

  if (!user) {
    return (
      <View style={styles.wrap}>
        <View style={styles.statsRow}>
          <Stat value={followerCount} label="Seguidores" />
          <Stat value={followingCount} label="Siguiendo" />
          <Stat value={friendCount} label="Amigos" />
        </View>
        <ActionButton label="Iniciar sesión para seguir" onPress={() => router.push('/login')} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.statsRow}>
        <Stat value={followerCount} label="Seguidores" />
        <Stat value={followingCount} label="Siguiendo" />
        <Stat value={friendCount} label="Amigos" />
      </View>

      {badge ? <Text style={styles.badge}>{badge}</Text> : null}

      <View style={styles.actionsRow}>
        {status === 'following' || status === 'mutual_follow' ? (
          <ActionButton
            label="Dejar de seguir"
            variant="secondary"
            onPress={() => {
              unfollow(targetEmail);
              setOk('Has dejado de seguir a este usuario.');
            }}
            style={styles.actionHalf}
          />
        ) : (
          <ActionButton
            label="Seguir"
            onPress={() => {
              follow(targetEmail);
              setOk(`Ahora sigues a ${targetName}.`);
              setError('');
            }}
            style={styles.actionHalf}
          />
        )}

        {status === 'friend' ? (
          <ActionButton
            label="Quitar amistad"
            variant="ghost"
            onPress={() => removeFriend(targetEmail)}
            style={styles.actionHalf}
          />
        ) : status === 'request_sent' ? (
          <ActionButton
            label="Cancelar solicitud"
            variant="secondary"
            onPress={() => {
              cancelFriendRequest(targetEmail);
              setOk('Solicitud cancelada.');
            }}
            style={styles.actionHalf}
          />
        ) : status === 'request_received' && incoming ? (
          <ActionButton
            label="Aceptar"
            onPress={() => {
              acceptFriendRequest(incoming.id);
              setOk(`¡Ahora sois amigos con ${targetName}!`);
            }}
            style={styles.actionHalf}
          />
        ) : (
          <ActionButton
            label="Amistad"
            variant="secondary"
            onPress={() => {
              setError('');
              setOk('');
              const result = sendFriendRequest(targetEmail, targetName);
              if (result.ok) setOk('Solicitud de amistad enviada.');
              else setError(result.error);
            }}
            style={styles.actionHalf}
          />
        )}
      </View>

      {status === 'request_received' && incoming ? (
        <ActionButton
          label="Rechazar solicitud"
          variant="ghost"
          onPress={() => rejectFriendRequest(incoming.id)}
        />
      ) : null}

      {ok ? <Text style={styles.ok}>{ok}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  badge: {
    alignSelf: 'center',
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: { gap: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionHalf: { flex: 1, minHeight: 44 },
  error: { color: colors.danger, fontSize: 13 },
  ok: { color: colors.accent, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  pendingBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pendingTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pendingName: { color: colors.accent, fontWeight: '700', fontSize: 14, flex: 1 },
  pendingActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  acceptBtn: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  acceptText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  rejectText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
});
