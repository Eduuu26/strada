import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useAuth } from '../../src/context/AuthContext';
import { useChats } from '../../src/context/ChatsContext';
import { colors, radius, spacing } from '../../src/theme';

function formatMsgTime(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getChat, sendMessage, markChatRead } = useChats();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const chat = id ? getChat(id) : undefined;

  const messageCount = chat?.messages.length ?? 0;
  useEffect(() => {
    if (chat && user) markChatRead(chat.id, user.email);
  }, [chat?.id, messageCount, user?.email, markChatRead]);
  const isMember =
    user && chat
      ? chat.participantEmails.some((e) => e.toLowerCase() === user.email.toLowerCase())
      : false;

  if (!chat) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Chat no encontrado.</Text>
      </SafeAreaView>
    );
  }

  function handleSend() {
    if (!user || !text.trim()) return;
    if (sendMessage(chat.id, { email: user.email, name: user.name }, text)) {
      setText('');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>{chat.title}</Text>
          <Text style={styles.chatParticipants}>
            {chat.participantEmails.length} participante
            {chat.participantEmails.length === 1 ? '' : 's'}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {chat.messages.length === 0 ? (
            <EmptyState
              icon="💬"
              title="Sin mensajes"
              message="Sé el primero en escribir al grupo."
            />
          ) : (
            chat.messages.map((msg) =>
            msg.type === 'system' ? (
              <View key={msg.id} style={styles.systemBubble}>
                <Text style={styles.systemText}>{msg.text}</Text>
              </View>
            ) : (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  msg.authorEmail === user?.email ? styles.msgRowMine : null,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.authorEmail === user?.email ? styles.bubbleMine : null,
                  ]}
                >
                  {msg.authorEmail !== user?.email ? (
                    <Text
                      style={styles.author}
                      onPress={
                        msg.authorEmail
                          ? () => router.push(`/user/${encodeURIComponent(msg.authorEmail!)}`)
                          : undefined
                      }
                    >
                      {msg.authorName}
                    </Text>
                  ) : null}
                  <Text style={styles.msgText}>{msg.text}</Text>
                  <Text style={styles.msgTime}>{formatMsgTime(msg.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {user && isMember ? (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <ActionButton label="Enviar" onPress={handleSend} disabled={!text.trim()} />
          </View>
        ) : (
          <View style={styles.lockedBox}>
            <Text style={styles.locked}>
              Apúntate a la ruta, quedada o club para escribir en el chat.
            </Text>
            {!user ? (
              <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  error: { color: colors.danger, padding: spacing.md },
  chatHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  chatTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  chatParticipants: { color: colors.textMuted, fontSize: 12 },
  messageScroll: { flex: 1 },
  messages: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg, flexGrow: 1 },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: '90%',
  },
  systemText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  msgRow: { alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  author: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  msgTime: { color: colors.textMuted, fontSize: 10, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  locked: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedBox: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
});
