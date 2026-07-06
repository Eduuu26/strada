import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SearchBar } from '../../src/components/SearchBar';
import { SectionTitle } from '../../src/components/SectionTitle';
import { useAuth } from '../../src/context/AuthContext';
import { useCommunities } from '../../src/context/CommunitiesContext';
import { formatPrice, membershipStatusLabel } from '../../src/lib/communities';
import type { Community } from '../../src/types';
import { colors, cardStyle, radius, spacing } from '../../src/theme';

type PriceFilter = 'all' | 'free' | 'paid';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { communities, loading, getMyMembership } = useCommunities();

  const mine = communities.filter((c) => getMyMembership(c.id));
  const discover = communities.filter((c) => !getMyMembership(c.id) && c.visibility === 'public');
  const [query, setQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');

  const filteredDiscover = useMemo(() => {
    const q = query.trim().toLowerCase();
    return discover.filter((c) => {
      if (priceFilter === 'free' && c.priceCents > 0) return false;
      if (priceFilter === 'paid' && c.priceCents <= 0) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [discover, query, priceFilter]);

  function Card({ community }: { community: Community }) {
    const membership = getMyMembership(community.id);
    const initial = community.name.charAt(0).toUpperCase();
    return (
      <Pressable style={styles.card} onPress={() => router.push(`/community/${community.id}`)}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{community.name}</Text>
              <Text style={styles.price}>{formatPrice(community)}</Text>
            </View>
            {community.description ? (
              <Text style={styles.cardMeta} numberOfLines={2}>
                {community.description}
              </Text>
            ) : null}
            {membership ? (
              <Text
                style={[
                  styles.badge,
                  membership.status === 'active' ? styles.badgeActive : styles.badgePending,
                ]}
              >
                {membershipStatusLabel(membership.status)}
              </Text>
            ) : (
              <Text style={styles.visibility}>
                {community.visibility === 'public' ? 'Pública' : 'Privada'}
              </Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Comunidades de pago"
          title="Comunidades"
          subtitle="Suscríbete a comunidades para acceder a sus rutas, avisos en directo y más."
        />

        {!user ? (
          <View style={styles.guestBox}>
            <Text style={styles.guestText}>
              Inicia sesión para crear comunidades o suscribirte a las de otros.
            </Text>
            <ActionButton label="Iniciar sesión" onPress={() => router.push('/login')} />
          </View>
        ) : (
          <ActionButton label="+ Crear comunidad" onPress={() => router.push('/community/create')} />
        )}

        {user ? (
          <>
            <SectionTitle>Mis comunidades ({mine.length})</SectionTitle>
            {mine.length ? (
              mine.map((c) => <Card key={c.id} community={c} />)
            ) : (
              <EmptyState
                icon="🌍"
                title="Sin comunidades"
                message="Crea tu propia comunidad de pago o explora las públicas disponibles."
                actionLabel="+ Crear comunidad"
                onAction={() => router.push('/community/create')}
              />
            )}
          </>
        ) : null}

        <SectionTitle>Descubrir</SectionTitle>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar comunidad…" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(
            [
              { id: 'all' as const, label: 'Todas' },
              { id: 'free' as const, label: 'Gratis' },
              { id: 'paid' as const, label: 'De pago' },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.id}
              style={[styles.chip, priceFilter === option.id && styles.chipActive]}
              onPress={() => setPriceFilter(option.id)}
            >
              <Text style={[styles.chipText, priceFilter === option.id && styles.chipTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading && !communities.length ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : filteredDiscover.length ? (
          filteredDiscover.map((c) => <Card key={c.id} community={c} />)
        ) : (
          <EmptyState
            icon="🔍"
            title={query || priceFilter !== 'all' ? 'Sin resultados' : 'Nada que descubrir'}
            message={
              query || priceFilter !== 'all'
                ? 'No hay comunidades que coincidan con tu búsqueda o filtro.'
                : user
                  ? 'Sé el primero en crear una comunidad pública.'
                  : 'Inicia sesión para crear o unirte a comunidades.'
            }
            actionLabel={query || priceFilter !== 'all' ? undefined : user ? '+ Crear comunidad' : 'Iniciar sesión'}
            onAction={
              query || priceFilter !== 'all'
                ? undefined
                : user
                  ? () => router.push('/community/create')
                  : () => router.push('/login')
            }
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
  loader: { marginVertical: spacing.lg },
  chipRow: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.text, fontWeight: '700' },
  card: {
    ...cardStyle,
    padding: spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  cardBody: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  price: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  visibility: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 22 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: 2,
  },
  badgeActive: { color: colors.success, backgroundColor: 'rgba(46,204,113,0.12)' },
  badgePending: { color: colors.textMuted, backgroundColor: colors.surfaceElevated },
});
