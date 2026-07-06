import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SearchBar } from '../../src/components/SearchBar';
import { SectionTitle } from '../../src/components/SectionTitle';
import { useAuth } from '../../src/context/AuthContext';
import { useChats } from '../../src/context/ChatsContext';
import type { RouteChat } from '../../src/types';
import { colors, cardStyle, radius, spacing } from '../../src/theme';

function formatChatTime(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

type IconName = ComponentProps<typeof Feather>['name'];

function chatIconName(chat: { clubId?: string; meetupId?: string; routeId?: string }): IconName {
  if (chat.clubId) return 'flag';
  if (chat.meetupId) return 'calendar';
  if (chat.routeId) return 'map';
  return 'message-circle';
}

function chatTypeLabel(chat: RouteChat): string {
  if (chat.clubId) return 'Club';
  if (chat.meetupId) return 'Quedada';
  if (chat.routeId) return 'Ruta';
  return 'Grupo';
}

function ChatRow({
  chat,
  unread,
  onPress,
}: {
  chat: RouteChat;
  unread: boolean;
  onPress: () => void;
}) {
  const last = chat.messages[chat.messages.length - 1];
  const preview =
    last?.type === 'system'
      ? last.text
      : `${last?.authorName || ''}: ${last?.text || 'Sin mensajes'}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.chatCard, pressed && styles.chatCardPressed]}
      onPress={onPress}
    >
      <View style={styles.chatIcon}>
        <Feather name={chatIconName(chat)} size={18} color={colors.accent} />
      </View>
      <View style={styles.chatBody}>
        <View style={styles.chatTitleRow}>
          <Text style={[styles.chatTitle, unread && styles.chatTitleUnread]} numberOfLines={1}>
            {chat.title}
          </Text>
          <Text style={styles.chatType}>{chatTypeLabel(chat)}</Text>
        </View>
        <Text style={[styles.chatPreview, unread && styles.chatPreviewUnread]} numberOfLines={2}>
          {preview}
        </Text>
        <Text style={styles.chatMeta}>
          {chat.participantEmails.length} participantes · {formatChatTime(chat.updatedAt)}
        </Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getUserChats, isChatUnread, getUnreadCount } = useChats();
  const [query, setQuery] = useState('');

  const chats = user ? getUserChats(user.email) : [];
  const unreadTotal = user ? getUnreadCount(user.email) : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some(
          (m) =>
            m.text.toLowerCase().includes(q) ||
            (m.authorName?.toLowerCase().includes(q) ?? false),
        ),
    );
  }, [chats, query]);

  const unreadChats = useMemo(() => {
    if (!user) return [];
    return filtered.filter((c) => isChatUnread(c.id, user.email));
  }, [filtered, user, isChatUnread]);

  const readChats = useMemo(() => {
    if (!user) return filtered;
    return filtered.filter((c) => !isChatUnread(c.id, user.email));
  }, [filtered, user, isChatUnread]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Grupo"
          title="Chats"
          subtitle="Al unirte a un club, ruta o quedada entras al chat con el resto de participantes."
        />

        {!user ? (
          <View style={styles.guestBox}>
            <Text style={styles.guestText}>Inicia sesión para ver tus chats de club, ruta y quedadas.</Text>
            <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />
          </View>
        ) : chats.length ? (
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar chat o mensaje…" />

            {unreadTotal > 0 ? (
              <View style={styles.unreadBanner}>
                <Text style={styles.unreadBannerText}>
                  {unreadTotal} {unreadTotal === 1 ? 'chat sin leer' : 'chats sin leer'}
                </Text>
              </View>
            ) : null}

            {unreadChats.length > 0 ? (
              <>
                <SectionTitle>Sin leer ({unreadChats.length})</SectionTitle>
                {unreadChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    unread
                    onPress={() => router.push(`/chat/${chat.id}`)}
                  />
                ))}
              </>
            ) : null}

            {readChats.length > 0 ? (
              <>
                <SectionTitle>
                  {unreadChats.length ? 'Todos los chats' : `Chats (${readChats.length})`}
                </SectionTitle>
                {readChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    unread={false}
                    onPress={() => router.push(`/chat/${chat.id}`)}
                  />
                ))}
              </>
            ) : null}

            {!filtered.length ? (
              <Text style={styles.hint}>Ningún chat coincide con tu búsqueda.</Text>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="💬"
            title="Sin chats todavía"
            message="Únete a un club o apúntate a una quedada o ruta. Se creará el grupo automáticamente."
            actionLabel="Ver quedadas"
            onAction={() => router.push('/(tabs)/events')}
            secondaryLabel="Explorar clubes"
            onSecondary={() => router.push('/(tabs)/clubs')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  guestBox: { gap: spacing.sm },
  guestText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  unreadBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  unreadBannerText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...cardStyle,
    padding: spacing.md,
  },
  chatCardPressed: { opacity: 0.8, borderColor: colors.accent },
  chatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBody: { flex: 1, gap: 2 },
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chatTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  chatTitleUnread: { fontWeight: '800' },
  chatType: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chatPreview: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  chatPreviewUnread: { color: colors.text },
  chatMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
