import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../../src/components/ActionButton';
import { EmptyState } from '../../src/components/EmptyState';
import { ScreenHero } from '../../src/components/ScreenHero';
import { SubscriptionCheckoutLegal } from '../../src/components/SubscriptionCheckoutLegal';
import { useAuth } from '../../src/context/AuthContext';
import { useCommunities } from '../../src/context/CommunitiesContext';
import { useCommunityRoutes } from '../../src/hooks/useCommunityRoutes';
import { useFuelStationsNearRoute } from '../../src/hooks/useFuelStationsNearRoute';
import { sendLiveAlert } from '../../src/lib/supabase/liveAlertsRepository';
import { formatPrice, isFreeCommunity, membershipStatusLabel } from '../../src/lib/communities';
import { formatMeters } from '../../src/lib/routeGeo';
import type { CommunityRoute, FuelPreference, RouteStatus } from '../../src/types';
import { colors, radius, spacing } from '../../src/theme';

const MEMBER_PERKS = [
  'Rutas exclusivas de la comunidad',
  'Avisos en directo del organizador',
  'Gasolineras filtradas por tu combustible',
];

function routeStatusLabel(status: RouteStatus): string {
  switch (status) {
    case 'published':
      return 'Publicada';
    case 'draft':
      return 'Borrador';
    case 'archived':
      return 'Archivada';
    default:
      return status;
  }
}

export default function CommunityDetailScreen() {
  const params = useLocalSearchParams<{ id: string; checkout?: string; stripe?: string }>();
  const { id, checkout, stripe } = params;
  const communityId = String(id);
  const router = useRouter();
  const { user } = useAuth();
  const {
    getCommunity,
    getMyMembership,
    isActiveMember,
    canManage,
    joinCommunity,
    leaveCommunity,
    subscribe,
    connectStripe,
    refresh,
  } = useCommunities();

  const community = getCommunity(communityId);
  const membership = getMyMembership(communityId);
  const manager = community ? canManage(community) : false;
  const active = isActiveMember(communityId);
  const canSeeContent = active || manager;

  const { routes, loading: routesLoading, publishRoute, archiveRoute } = useCommunityRoutes(
    canSeeContent ? communityId : undefined,
  );

  const visibleRoutes = useMemo(() => {
    if (manager) return routes;
    return routes.filter((r) => r.status === 'published');
  }, [routes, manager]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [subscribeAccepted, setSubscribeAccepted] = useState(false);

  useEffect(() => {
    if (checkout === 'success') {
      setNotice('Pago recibido. Activando tu membresía…');
      void refresh();
    } else if (checkout === 'cancel') {
      setNotice('Pago cancelado. Puedes intentarlo de nuevo cuando quieras.');
    } else if (stripe === 'connected') {
      setNotice('Stripe conectado correctamente. Ya puedes cobrar suscripciones.');
      void refresh();
    }
  }, [checkout, stripe, refresh]);

  if (!community) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Comunidad no encontrada</Text>
          <Text style={styles.muted}>
            Puede ser privada o no estar disponible en este momento.
          </Text>
          <ActionButton label="Volver" variant="secondary" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  async function runUrlAction(p: Promise<{ ok: true; url: string } | { ok: false; error: string }>) {
    setError(null);
    setBusy(true);
    try {
      const res = await p;
      if (res.ok) await Linking.openURL(res.url);
      else setError(res.error);
    } finally {
      setBusy(false);
    }
  }

  async function onJoinFree() {
    setError(null);
    setBusy(true);
    try {
      const res = await joinCommunity(communityId);
      if (!res.ok) setError(res.error);
    } finally {
      setBusy(false);
    }
  }

  function renderPrimaryAction() {
    if (!user) {
      return <ActionButton label="Inicia sesión" onPress={() => router.push('/login')} />;
    }
    if (!membership) {
      if (isFreeCommunity(community!)) {
        return <ActionButton label="Unirme gratis" onPress={onJoinFree} disabled={busy} />;
      }
      return (
        <>
          <SubscriptionCheckoutLegal
            priceLabel={formatPrice(community!)}
            accepted={subscribeAccepted}
            onAcceptChange={setSubscribeAccepted}
          />
          <ActionButton
            label={`Suscribirme · ${formatPrice(community!)}`}
            onPress={() => {
              if (!subscribeAccepted) {
                setError('Marca la casilla de información precontractual para continuar.');
                return;
              }
              runUrlAction(subscribe(communityId));
            }}
            disabled={busy}
          />
        </>
      );
    }
    if (membership.status === 'inactive') {
      return (
        <ActionButton
          label="Completar pago"
          onPress={() => runUrlAction(subscribe(communityId))}
          disabled={busy}
        />
      );
    }
    if (membership.status === 'past_due') {
      return (
        <ActionButton
          label="Actualizar método de pago"
          onPress={() => runUrlAction(subscribe(communityId))}
          disabled={busy}
        />
      );
    }
    return null;
  }

  const fuelKey: FuelPreference | undefined = active ? user?.fuelPref : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHero
          kicker="Comunidad"
          title={community.name}
          subtitle={community.description ?? 'Rutas y avisos exclusivos para miembros.'}
          pills={[community.visibility === 'public' ? 'Pública' : 'Privada', formatPrice(community)]}
        />

        {membership ? (
          <Text style={styles.membershipChip}>{membershipStatusLabel(membership.status)}</Text>
        ) : null}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {renderPrimaryAction()}

        {active ? <Text style={styles.activeNote}>Eres miembro activo de esta comunidad.</Text> : null}

        {!canSeeContent ? (
          <View style={styles.perksBox}>
            <Text style={styles.perksTitle}>Al suscribirte obtienes</Text>
            {MEMBER_PERKS.map((perk) => (
              <Text key={perk} style={styles.perkItem}>
                ✓ {perk}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Gestor: Stripe Connect */}
        {manager && !isFreeCommunity(community) ? (
          <View style={styles.managerCard}>
            <Text style={styles.section}>Gestión de cobros</Text>
            {community.stripeAccountId ? (
              <Text style={styles.muted}>Stripe conectado. Ya puedes recibir suscripciones.</Text>
            ) : (
              <>
                <Text style={styles.muted}>
                  Conecta tu cuenta de Stripe para empezar a cobrar las suscripciones.
                </Text>
                <ActionButton
                  label="Conectar Stripe"
                  variant="secondary"
                  onPress={() => runUrlAction(connectStripe(communityId))}
                  disabled={busy}
                />
              </>
            )}
          </View>
        ) : null}

        {/* Contenido (rutas) */}
        {canSeeContent ? (
          <>
            <Text style={styles.section}>
              Rutas{visibleRoutes.length ? ` (${visibleRoutes.length})` : ''}
            </Text>
            {manager ? (
              <ActionButton
                label="+ Crear ruta"
                variant="secondary"
                onPress={() => router.push(`/community/new-route?communityId=${communityId}`)}
              />
            ) : null}
            {routesLoading && !routes.length ? (
              <ActivityIndicator color={colors.accent} style={styles.loader} />
            ) : visibleRoutes.length ? (
              visibleRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  manager={manager}
                  fuelKey={fuelKey}
                  onPublish={() => publishRoute(route.id)}
                  onArchive={() => archiveRoute(route.id)}
                />
              ))
            ) : (
              <EmptyState
                icon="🗺️"
                title="Sin rutas todavía"
                message={
                  manager
                    ? 'Crea la primera ruta exclusiva para tus miembros.'
                    : 'El organizador aún no ha publicado rutas.'
                }
                actionLabel={manager ? '+ Crear ruta' : undefined}
                onAction={
                  manager
                    ? () => router.push(`/community/new-route?communityId=${communityId}`)
                    : undefined
                }
              />
            )}
          </>
        ) : (
          <Text style={styles.muted}>
            Suscríbete para acceder a las rutas y los avisos en directo de la comunidad.
          </Text>
        )}

        {/* Salir */}
        {membership && community.ownerId !== user?.id ? (
          <ActionButton
            label="Salir de la comunidad"
            variant="ghost"
            onPress={() => {
              const paid = !isFreeCommunity(community);
              const msg = paid
                ? 'Se cancelará tu suscripción mensual. Seguirás teniendo acceso hasta el final del periodo facturado. ¿Continuar?'
                : '¿Seguro que quieres salir de esta comunidad?';
              Alert.alert('Salir de la comunidad', msg, [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  style: 'destructive',
                  onPress: () => {
                    void leaveCommunity(communityId);
                  },
                },
              ]);
            }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RouteCard({
  route,
  manager,
  fuelKey,
  onPublish,
  onArchive,
}: {
  route: CommunityRoute;
  manager: boolean;
  fuelKey?: FuelPreference;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const { cheapest } = useFuelStationsNearRoute(fuelKey ? route.id : undefined, fuelKey);
  const [alertText, setAlertText] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSendAlert() {
    if (!alertText.trim()) return;
    setSending(true);
    setAlertMsg(null);
    try {
      const res = await sendLiveAlert(route.id, alertText.trim());
      if (res.ok) {
        setAlertMsg(`Aviso enviado a ${res.recipients} miembro(s).`);
        setAlertText('');
        setAlertOpen(false);
      } else {
        setAlertMsg(res.error);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.routeCard}>
      <View style={styles.routeTop}>
        <Text style={styles.routeTitle}>{route.title}</Text>
        <Text style={styles.routeStatus}>{routeStatusLabel(route.status)}</Text>
      </View>
      <Text style={styles.muted}>
        {formatMeters(route.distanceM)}
        {route.difficulty ? ` · ${route.difficulty}` : ''}
        {route.stops?.length ? ` · ${route.stops.length} paradas` : ''}
      </Text>

      {fuelKey && cheapest ? (
        <Text style={styles.fuelNote}>
          ⛽ Más barata cerca: {cheapest.brand ?? 'Gasolinera'} · {cheapest.price.toFixed(3)} € (
          {formatMeters(cheapest.distanceM)})
        </Text>
      ) : null}

      {manager ? (
        <View style={styles.routeActions}>
          {route.status !== 'published' ? (
            <Pressable onPress={onPublish}>
              <Text style={styles.link}>Publicar</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onArchive}>
              <Text style={styles.link}>Archivar</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setAlertOpen((v) => !v)}>
            <Text style={styles.link}>{alertOpen ? 'Cancelar aviso' : 'Enviar aviso'}</Text>
          </Pressable>
        </View>
      ) : null}

      {manager && alertOpen ? (
        <View style={styles.alertBox}>
          <TextInput
            style={styles.alertInput}
            value={alertText}
            onChangeText={setAlertText}
            placeholder="Mensaje para los miembros…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <ActionButton
            label={sending ? 'Enviando…' : 'Enviar a la comunidad'}
            variant="secondary"
            onPress={onSendAlert}
            disabled={sending || !alertText.trim()}
          />
        </View>
      ) : null}

      {alertMsg ? <Text style={styles.muted}>{alertMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  loader: { marginVertical: spacing.lg },
  membershipChip: {
    alignSelf: 'flex-start',
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  perksBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  perksTitle: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: spacing.xs },
  perkItem: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 },
  price: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  description: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 4 },
  error: { color: colors.danger, fontSize: 14 },
  notice: { color: colors.accent, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  activeNote: { color: colors.success, fontSize: 13, fontWeight: '600' },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  managerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  routeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  routeTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  routeStatus: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  fuelNote: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  routeActions: { flexDirection: 'row', gap: spacing.lg, marginTop: 4 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  alertBox: { gap: spacing.sm, marginTop: spacing.sm },
  alertInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    minHeight: 64,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
