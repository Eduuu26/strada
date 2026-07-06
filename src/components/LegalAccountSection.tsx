import { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionButton } from './ActionButton';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/env';
import {
  getCookiePolicyUrl,
  getLegalNoticeUrl,
  getPrivacyPolicyUrl,
  getSubscriptionTermsUrl,
  getTermsUrl,
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  openLegalUrl,
} from '../lib/legal';
import {
  deleteUserAccount,
  exportUserData,
  openBillingPortal,
} from '../lib/supabase/accountRepository';
import { colors, fonts, radius, spacing } from '../theme';

function openUrl(url: string) {
  openLegalUrl(url);
}

async function shareExport(data: Record<string, unknown>) {
  const json = JSON.stringify(data, null, 2);
  const fileName = `strada-datos-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ message: json, title: fileName });
}

export function LegalAccountSection() {
  const { user, logout, deleteAccount, exportAccountData } = useAuth();
  const [busy, setBusy] = useState<'export' | 'delete' | 'billing' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!user) return null;

  async function onExport() {
    setMessage(null);
    setBusy('export');
    try {
      const data = await exportAccountData();
      await shareExport(data);
      setMessage('Datos exportados correctamente.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo exportar.');
    } finally {
      setBusy(null);
    }
  }

  function onDeleteRequest() {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu perfil, vehículos y datos asociados de forma permanente. Las suscripciones activas se cancelarán. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar definitivamente',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy('delete');
              setMessage(null);
              try {
                await deleteAccount();
                logout();
              } catch (e) {
                setMessage(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
              } finally {
                setBusy(null);
              }
            })();
          },
        },
      ],
    );
  }

  async function onBillingPortal() {
    setMessage(null);
    setBusy('billing');
    try {
      if (isSupabaseConfigured()) {
        const res = await openBillingPortal();
        if (!res.ok) throw new Error(res.error);
        await Linking.openURL(res.value);
      } else {
        setMessage('Gestiona tus suscripciones desde el correo de confirmación de Stripe.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No se pudo abrir facturación.');
    } finally {
      setBusy(null);
    }
  }

  const links = [
    { label: 'Política de privacidad', url: getPrivacyPolicyUrl() },
    { label: 'Términos de uso', url: getTermsUrl() },
    { label: 'Aviso legal', url: getLegalNoticeUrl() },
    { label: 'Condiciones de suscripción', url: getSubscriptionTermsUrl() },
    { label: 'Política de cookies', url: getCookiePolicyUrl() },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Privacidad y legal</Text>
      <Text style={styles.hint}>
        {LEGAL_COMPANY_NAME} · Ejerce tus derechos de acceso, portabilidad y supresión (RGPD / LOPDGDD).
        Contacto:{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${LEGAL_CONTACT_EMAIL}`)}>
          {LEGAL_CONTACT_EMAIL}
        </Text>
      </Text>

      {links.map((l) => (
        <Pressable key={l.label} onPress={() => openUrl(l.url)} style={styles.docRow}>
          <Text style={styles.docLink}>{l.label}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}

      <View style={styles.actions}>
        <ActionButton
          label={busy === 'export' ? 'Exportando…' : 'Descargar mis datos'}
          variant="secondary"
          onPress={onExport}
          disabled={!!busy}
        />
        {isSupabaseConfigured() ? (
          <ActionButton
            label={busy === 'billing' ? 'Abriendo…' : 'Gestionar suscripciones'}
            variant="secondary"
            onPress={onBillingPortal}
            disabled={!!busy}
          />
        ) : null}
        <ActionButton
          label={busy === 'delete' ? 'Eliminando…' : 'Eliminar cuenta'}
          variant="secondary"
          onPress={onDeleteRequest}
          disabled={!!busy}
          style={styles.dangerBtn}
        />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 16, fontWeight: '800', ...font },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20, ...font },
  link: { color: colors.accent, fontWeight: '600' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  docLink: { color: colors.text, fontSize: 14, fontWeight: '600', ...font },
  chevron: { color: colors.textMuted, fontSize: 18 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  dangerBtn: { borderColor: colors.danger },
  message: { color: colors.textSecondary, fontSize: 13, ...font },
});
