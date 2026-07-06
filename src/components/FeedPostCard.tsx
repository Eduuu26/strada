import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SmartImage } from './SmartImage';
import { timeAgo } from '../data/feedSeed';
import type { FeedPost } from '../types';
import { colors, cardStyle, fonts, radius, spacing } from '../theme';

type Props = {
  post: FeedPost;
  liked: boolean;
  canInteract: boolean;
  authorAvatarUrl?: string;
  canDelete?: boolean;
  deleting?: boolean;
  onLike: () => void;
  onComment: (text: string) => void;
  onDelete?: () => void;
  onRequireAuth: () => void;
  onOpenProfile?: (email: string) => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function FeedPostCard({
  post,
  liked,
  canInteract,
  authorAvatarUrl,
  canDelete,
  deleting,
  onLike,
  onComment,
  onDelete,
  onRequireAuth,
  onOpenProfile,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const commentRef = useRef<TextInput>(null);

  function focusComment() {
    if (!canInteract) {
      onRequireAuth();
      return;
    }
    setExpanded(true);
    commentRef.current?.focus();
  }

  const meta = [post.vehicleLabel, post.routeTitle].filter(Boolean).join(' · ');
  const comments = post.comments;
  const hiddenCount = expanded ? 0 : Math.max(0, comments.length - 2);
  const visibleComments = expanded ? comments : comments.slice(-2);

  function handleLike() {
    if (!canInteract) {
      onRequireAuth();
      return;
    }
    onLike();
  }

  function handleSubmitComment() {
    if (!canInteract) {
      onRequireAuth();
      return;
    }
    if (!comment.trim()) return;
    onComment(comment.trim());
    setComment('');
    setExpanded(true);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.authorRow, pressed && styles.authorRowPressed]}
          onPress={() => onOpenProfile?.(post.authorEmail)}
          disabled={!onOpenProfile}
        >
          <View style={styles.avatar}>
            {authorAvatarUrl ? (
              <Image source={{ uri: authorAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(post.authorName)}</Text>
            )}
          </View>
          <View style={styles.author}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </View>
        </Pressable>
        <View style={styles.headerRight}>
          {canDelete && onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={styles.deleteBtn}
              disabled={deleting}
              accessibilityLabel="Eliminar publicación"
            >
              <Feather name="trash-2" size={18} color={deleting ? colors.textMuted : colors.danger} />
            </Pressable>
          ) : null}
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      <SmartImage uri={post.imageUrl} style={styles.image} fallbackIcon="🏍️" />

      <View style={styles.actions}>
        <Pressable onPress={handleLike} hitSlop={8} style={styles.actionBtn}>
          <Feather
            name="heart"
            size={22}
            color={liked ? colors.accent : colors.textSecondary}
            style={liked ? undefined : { opacity: 0.85 }}
          />
        </Pressable>
        <Pressable onPress={focusComment} hitSlop={8} style={styles.actionBtn}>
          <Feather name="message-circle" size={21} color={colors.textSecondary} />
        </Pressable>
      </View>

      {post.likes.length > 0 ? (
        <Text style={styles.likes}>{post.likes.length} me gusta</Text>
      ) : null}

      <Text style={styles.caption}>
        <Text style={styles.captionAuthor}>{post.authorName} </Text>
        {post.caption}
      </Text>

      <View style={styles.comments}>
        {hiddenCount > 0 ? (
          <Pressable onPress={() => setExpanded(true)}>
            <Text style={styles.moreComments}>
              Ver los {hiddenCount} comentarios anteriores
            </Text>
          </Pressable>
        ) : null}
        {visibleComments.map((item) => (
          <Text key={item.id} style={styles.comment}>
            <Text style={styles.commentAuthor}>{item.authorName} </Text>
            {item.text}
          </Text>
        ))}
      </View>

      <View style={styles.commentForm}>
        <TextInput
          ref={commentRef}
          style={styles.commentInput}
          placeholder={canInteract ? 'Añade un comentario…' : 'Inicia sesión para comentar'}
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          editable={canInteract}
          maxLength={280}
          onSubmitEditing={handleSubmitComment}
          returnKeyType="send"
        />
        <Pressable onPress={handleSubmitComment} disabled={!canInteract || !comment.trim()}>
          <Text
            style={[
              styles.commentSend,
              (!canInteract || !comment.trim()) && styles.commentSendDisabled,
            ]}
          >
            Publicar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorRowPressed: { opacity: 0.6 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  author: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  deleteBtn: { padding: 2 },
  authorName: { color: colors.text, fontWeight: '700', fontSize: 14, ...font },
  meta: { color: colors.textMuted, fontSize: 12, ...font },
  time: { color: colors.textMuted, fontSize: 11 },
  image: { width: '100%', aspectRatio: 4 / 3, maxHeight: 420, backgroundColor: '#0a0e12' },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    padding: 2,
  },
  likes: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
  },
  caption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  captionAuthor: { fontWeight: '700' },
  comments: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs, gap: 4 },
  moreComments: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  comment: { color: colors.text, fontSize: 13, lineHeight: 18 },
  commentAuthor: { fontWeight: '700' },
  commentForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
    ...font,
  },
  commentSend: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  commentSendDisabled: { opacity: 0.4 },
});
