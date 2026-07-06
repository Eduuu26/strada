import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { CreatePostModal } from '../../src/components/CreatePostModal';
import { EmptyState } from '../../src/components/EmptyState';
import { FeedPostCard } from '../../src/components/FeedPostCard';
import { ScreenHero } from '../../src/components/ScreenHero';
import { useAuth } from '../../src/context/AuthContext';
import { useFeed } from '../../src/context/FeedContext';
import { colors, spacing } from '../../src/theme';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    posts,
    loading,
    refreshing,
    refresh,
    feedError,
    clearFeedError,
    isLiveFeed,
    toggleLike,
    isLiked,
    addComment,
    createPost,
    deletePost,
    getAuthorAvatar,
  } = useFeed();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function confirmDelete(postId: string, onConfirm: () => void) {
    const message = '¿Eliminar esta publicación? No se puede deshacer.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) onConfirm();
      return;
    }
    Alert.alert('Eliminar publicación', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onConfirm },
    ]);
  }

  async function handleDelete(postId: string, userEmail: string) {
    if (deletingId) return;
    confirmDelete(postId, async () => {
      setDeletingId(postId);
      try {
        const ok = await deletePost(postId, userEmail);
        if (!ok && Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('No se pudo eliminar la publicación.');
        }
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <ScreenHero
          kicker="Comunidad"
          title="Explorar"
          subtitle="Fotos de rutas, coches y motos. Dale like, comenta o comparte tu experiencia."
        />

        {user ? (
          <ActionButton label="+ Nueva publicación" onPress={() => setCreateOpen(true)} />
        ) : (
          <ActionButton
            label="Inicia sesión para publicar"
            variant="secondary"
            onPress={() => router.push('/login')}
          />
        )}

        {postSuccess ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Publicación creada correctamente.</Text>
          </View>
        ) : null}

        {!user && isLiveFeed ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              Estás viendo publicaciones reales de la comunidad. Inicia sesión para dar like, comentar o publicar.
            </Text>
          </View>
        ) : null}

        {feedError ? (
          <Pressable style={styles.errorBanner} onPress={clearFeedError}>
            <Text style={styles.errorBannerText}>{feedError}</Text>
            <Text style={styles.errorDismiss}>Toca para cerrar</Text>
          </Pressable>
        ) : null}

        <View style={styles.feed}>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : posts.length ? (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                liked={user ? isLiked(post.id, user.email) : false}
                canInteract={!!user}
                authorAvatarUrl={getAuthorAvatar(post.authorEmail)}
                canDelete={!!user && post.authorEmail.toLowerCase() === user.email.toLowerCase()}
                onLike={() => user && toggleLike(post.id, user.email)}
                onComment={(text) => user && addComment(post.id, user, text)}
                onDelete={
                  user
                    ? () => void handleDelete(post.id, user.email)
                    : undefined
                }
                deleting={deletingId === post.id}
                onRequireAuth={() => router.push('/login')}
                onOpenProfile={(email) => router.push(`/user/${encodeURIComponent(email)}`)}
              />
            ))
          ) : (
            <EmptyState
              icon="🧭"
              title="El feed está vacío"
              message="Comparte tu primera foto de ruta, coche o moto con la comunidad."
              actionLabel={user ? '+ Nueva publicación' : 'Iniciar sesión'}
              onAction={user ? () => setCreateOpen(true) : () => router.push('/login')}
            />
          )}
        </View>
      </ScrollView>

      <CreatePostModal
        visible={createOpen}
        authorName={user?.name}
        vehicles={user?.vehicles}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (input) => {
          if (!user) return;
          await createPost(input, user);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          setPostSuccess(true);
          setTimeout(() => setPostSuccess(false), 3000);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  feed: { gap: spacing.md },
  loader: { marginVertical: spacing.xl },
  successBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
  },
  successBannerText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  infoBanner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoBannerText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  errorBanner: {
    backgroundColor: 'rgba(220,53,69,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    gap: 4,
  },
  errorBannerText: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  errorDismiss: { color: colors.textMuted, fontSize: 12 },
});
