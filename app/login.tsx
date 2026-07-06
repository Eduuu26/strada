import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../src/components/ActionButton';
import { LegalFooter } from '../src/components/LegalFooter';
import { FormField } from '../src/components/FormField';
import { ScreenHero } from '../src/components/ScreenHero';
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from '../src/context/AuthContext';
import { INVALID_EMAIL_MESSAGE, isValidEmail } from '../src/lib/email';
import { isSupabaseConfigured } from '../src/lib/env';
import { useAuth } from '../src/context/AuthContext';
import { colors, fonts, radius, spacing } from '../src/theme';

const BENEFITS = [
  'Apuntarte a rutas y quedadas',
  'Match de coches y motos',
  'Chats de grupo y ubicación en vivo',
];

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const afterAuth = typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/(tabs)/profile';

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Introduce correo y contraseña.');
      return;
    }
    if (!isValidEmail(email)) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace(afterAuth as '/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError('');
    setLoading(true);
    try {
      await login(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD);
      router.replace('/(tabs)/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar con la cuenta demo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHero
            kicker="Acceso"
            title="Inicia sesión"
            subtitle="Entra para guardar rutas, unirte a eventos y compartir ubicación con tu grupo."
          />

          <View style={styles.benefits}>
            {BENEFITS.map((item) => (
              <Text key={item} style={styles.benefitItem}>
                ✓ {item}
              </Text>
            ))}
          </View>

          <View style={styles.form}>
            <FormField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@correo.com"
            />

            <FormField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              holdToRevealPassword
              placeholder="Tu contraseña"
            />

            <Link href="/forgot-password" asChild>
              <Pressable style={styles.forgot}>
                <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </Link>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ActionButton
              label={loading ? 'Entrando…' : 'Iniciar sesión'}
              onPress={handleSubmit}
              disabled={loading}
            />

            {!isSupabaseConfigured() ? (
              <ActionButton
                label="Probar con cuenta demo (Carlos)"
                variant="secondary"
                onPress={handleDemoLogin}
                disabled={loading}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={styles.link}>Crear cuenta</Text>
              </Pressable>
            </Link>
          </View>

          <Link href="/(tabs)" asChild>
            <Pressable style={styles.guest}>
              <Text style={styles.guestText}>Continuar sin cuenta</Text>
            </Pressable>
          </Link>

          <LegalFooter compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  benefits: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  benefitItem: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  form: { gap: spacing.md },
  error: { color: colors.danger, fontSize: 14, ...font },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  footerText: { color: colors.textMuted, fontSize: 14, ...font },
  link: { color: colors.accent, fontSize: 14, fontWeight: '600', ...font },
  forgot: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  guest: { alignItems: 'center', paddingVertical: spacing.md },
  guestText: { color: colors.textMuted, fontSize: 14, fontWeight: '500', ...font },
});
