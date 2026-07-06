import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getSubscriptionTermsUrl, getTermsUrl, openLegalUrl } from '../lib/legal';
import { colors, fonts, spacing } from '../theme';

type Props = {
  priceLabel: string;
  onAcceptChange?: (accepted: boolean) => void;
  accepted?: boolean;
};

export function SubscriptionCheckoutLegal({ priceLabel, accepted, onAcceptChange }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Información precontractual</Text>
      <Text style={styles.text}>
        Suscripción mensual recurrente: {priceLabel}. Se renovará automáticamente hasta que la canceles desde tu
        perfil o al salir de la comunidad. Al continuar aceptas las{' '}
        <Text style={styles.link} onPress={() => openLegalUrl(getSubscriptionTermsUrl())}>
          condiciones de suscripción
        </Text>{' '}
        y los{' '}
        <Text style={styles.link} onPress={() => openLegalUrl(getTermsUrl())}>
          términos de uso
        </Text>
        . Como consumidor, solicitas el acceso inmediato al contenido digital y reconoces que puedes perder el
        derecho de desistimiento de 14 días una vez accedas (art. 103.m TRLGDCU).
      </Text>
      {onAcceptChange ? (
        <Pressable style={styles.checkRow} onPress={() => onAcceptChange(!accepted)}>
          <View style={[styles.check, accepted && styles.checkOn]}>
            {accepted ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkText}>He leído la información y deseo suscribirme</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontWeight: '700', fontSize: 14, ...font },
  text: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, ...font },
  link: { color: colors.accent, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: '800' },
  checkText: { color: colors.textMuted, fontSize: 12, flex: 1, lineHeight: 17, ...font },
});
