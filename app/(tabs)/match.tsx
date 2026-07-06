import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SwipeCarCard } from '../../src/components/SwipeCarCard';
import { useAuth } from '../../src/context/AuthContext';
import { useCarMatch } from '../../src/context/CarMatchContext';
import { timeAgo } from '../../src/data/feedSeed';
import { colors, radius, spacing } from '../../src/theme';

const LIKES_PREVIEW = 5;

export default function MatchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentCard,
    nextCard,
    remainingCount,
    loading,
    swipe,
    notifications,
    outgoingLikes,
    unreadCount,
    markRead,
    markAllRead,
    refreshDeck,
    resetSwipes,
  } = useCarMatch();
  const likesScrollRef = useRef<ScrollView>(null);
  const [incomingPanelY, setIncomingPanelY] = useState(0);
  const [showAllIncoming, setShowAllIncoming] = useState(false);
  const [showAllOutgoing, setShowAllOutgoing] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.content}>
          <ScreenHero
            kicker="Garaje"
            title="Match"
            subtitle="Desliza coches y motos de otros conductores. Si te gusta uno, le avisamos al dueño."
          />
          <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />
        </View>
      </SafeAreaView>
    );
  }

  const hasVehicle = (user.vehicles ?? []).some((v) => v.photoUrl || v.brand);
  const incomingVisible = showAllIncoming ? notifications : notifications.slice(0, LIKES_PREVIEW);
  const outgoingVisible = showAllOutgoing ? outgoingLikes : outgoingLikes.slice(0, LIKES_PREVIEW);

  function openProfile(email: string) {
    router.push(`/user/${encodeURIComponent(email)}`);
  }

  function scrollToLikes() {
    likesScrollRef.current?.scrollTo({ y: Math.max(incomingPanelY, 0), animated: true });
    if (unreadCount > 0) markAllRead();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.layout}>
        <View style={styles.header}>
          <ScreenHero
            kicker="Garaje"
            title="Match"
            subtitle="Desliza a la derecha si te gusta · a la izquierda para pasar"
          />

          {!hasVehicle ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Añade al menos un coche con foto en tu Perfil para que otros puedan descubrirte también.
              </Text>
              <ActionButton label="Ir a mi garaje" onPress={() => router.push('/(tabs)/profile')} />
            </View>
          ) : null}

          {unreadCount > 0 ? (
            <Pressable style={styles.notifBanner} onPress={scrollToLikes}>
              <Text style={styles.notifTitle}>
                {unreadCount}{' '}
                {unreadCount === 1 ? 'persona le gustó tu coche' : 'personas les gustó tu coche'}
              </Text>
              <Text style={styles.notifSub}>Toca para ver quién fue</Text>
            </Pressable>
          ) : null}

          {remainingCount > 0 && !loading ? (
            <Text style={styles.deckCounter}>
              {remainingCount} {remainingCount === 1 ? 'vehículo disponible' : 'vehículos disponibles'}
            </Text>
          ) : null}
        </View>

        <View style={styles.deckArea}>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : currentCard ? (
            <View style={styles.deckStack}>
              {nextCard ? (
                <SwipeCarCard key={`preview-${nextCard.id}`} card={nextCard} onSwipe={swipe} preview />
              ) : null}
              <SwipeCarCard
                key={currentCard.id}
                card={currentCard}
                onSwipe={swipe}
                onOpenProfile={openProfile}
              />
            </View>
          ) : (
            <EmptyState
              icon="🏁"
              title="No hay más coches cerca"
              message="Has visto todos los perfiles disponibles. Puedes empezar de nuevo o volver más tarde."
              actionLabel="Ver de nuevo"
              onAction={resetSwipes}
            />
          )}
        </View>

        <ScrollView
          ref={likesScrollRef}
          style={styles.likesScroll}
          contentContainerStyle={styles.likesContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {!loading && !currentCard ? (
            <Pressable style={styles.secondaryAction} onPress={refreshDeck}>
              <Text style={styles.secondaryActionText}>Actualizar mazo</Text>
            </Pressable>
          ) : null}

          {notifications.length ? (
            <View
              style={styles.likesPanel}
              onLayout={(e) => setIncomingPanelY(e.nativeEvent.layout.y)}
            >
              <Text style={styles.likesTitle}>Les gustó tu coche ({notifications.length})</Text>
              {incomingVisible.map((n) => (
                <Pressable
                  key={n.id}
                  style={[styles.likeRow, !n.read && styles.likeRowUnread]}
                  onPress={() => {
                    markRead(n.id);
                    openProfile(n.fromEmail);
                  }}
                >
                  <Text style={styles.likeText}>
                    <Text style={styles.likeName}>{n.fromName}</Text> · {n.vehicleLabel}
                  </Text>
                  <Text style={styles.likeTime}>{timeAgo(n.createdAt)}</Text>
                </Pressable>
              ))}
              {notifications.length > LIKES_PREVIEW ? (
                <Pressable onPress={() => setShowAllIncoming((v) => !v)}>
                  <Text style={styles.showMore}>
                    {showAllIncoming ? 'Ver menos' : `Ver todos (${notifications.length})`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {outgoingLikes.length ? (
            <View style={styles.likesPanel}>
              <Text style={styles.likesTitle}>Tus likes ({outgoingLikes.length})</Text>
              {outgoingVisible.map((n) => (
                <Pressable
                  key={n.id}
                  style={styles.likeRow}
                  onPress={() => openProfile(n.toEmail)}
                >
                  <Text style={styles.likeText}>
                    Te gustó el <Text style={styles.likeName}>{n.vehicleLabel}</Text>
                  </Text>
                  <Text style={styles.likeTime}>{timeAgo(n.createdAt)}</Text>
                </Pressable>
              ))}
              {outgoingLikes.length > LIKES_PREVIEW ? (
                <Pressable onPress={() => setShowAllOutgoing((v) => !v)}>
                  <Text style={styles.showMore}>
                    {showAllOutgoing ? 'Ver menos' : `Ver todos (${outgoingLikes.length})`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  layout: { flex: 1 },
  header: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.sm },
  content: { padding: spacing.md, gap: spacing.md },
  deckArea: { minHeight: 380, maxHeight: 460, flexGrow: 0, position: 'relative', marginHorizontal: spacing.md },
  deckStack: { flex: 1, position: 'relative' },
  deckCounter: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: { marginTop: spacing.xl },
  hintBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  hintText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  notifBanner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: 4,
  },
  notifTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  notifSub: { color: colors.textMuted, fontSize: 12 },
  likesScroll: { flex: 1 },
  likesContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  secondaryAction: { alignSelf: 'center', paddingVertical: spacing.xs },
  secondaryActionText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  likesPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  likesTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  likeRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  likeRowUnread: {
    backgroundColor: 'rgba(232,112,58,0.08)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  likeText: { color: colors.textMuted, fontSize: 14 },
  likeName: { color: colors.text, fontWeight: '700' },
  likeTime: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  showMore: { color: colors.accent, fontWeight: '700', fontSize: 13, paddingTop: spacing.xs },
});
