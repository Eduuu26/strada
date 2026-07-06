import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COOKIE_CONSENT_KEY, getCookiePolicyUrl, getPrivacyPolicyUrl, openLegalUrl } from '../lib/legal';
import { useCookieConsent, WEB_TAB_BAR_HEIGHT } from '../context/CookieConsentContext';
import { colors, fonts, layout, radius, spacing } from '../theme';

export function CookieConsentBanner() {
  const { visible, setVisible, setHeight } = useCookieConsent();
  const segments = useSegments();
  const onTabs = segments[0] === '(tabs)';

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    void AsyncStorage.getItem(COOKIE_CONSENT_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, [setVisible]);

  async function accept() {
    await AsyncStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  }

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View
      style={[styles.bar, onTabs && styles.barAboveTabs]}
      accessibilityRole="alert"
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <Text style={styles.text}>
        Usamos almacenamiento local y cookies técnicas para mantener tu sesión y preferencias, conforme al
        RGPD y la LSSI. Consulta nuestra{' '}
        <Text style={styles.link} onPress={() => openLegalUrl(getCookiePolicyUrl())}>
          política de cookies
        </Text>{' '}
        y la{' '}
        <Text style={styles.link} onPress={() => openLegalUrl(getPrivacyPolicyUrl())}>
          política de privacidad
        </Text>
        .
      </Text>
      <Pressable style={styles.btn} onPress={accept} accessibilityRole="button">
        <Text style={styles.btnText}>Aceptar</Text>
      </Pressable>
    </View>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
      },
      default: {},
    }),
  },
  barAboveTabs: {
    bottom: WEB_TAB_BAR_HEIGHT,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    ...font,
  },
  link: { color: colors.accent, fontWeight: '600' },
  btn: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14, ...font },
});
