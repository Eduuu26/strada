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
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../src/components/ActionButton';
import { FormField } from '../src/components/FormField';
import { ScreenHero } from '../src/components/ScreenHero';
import { INVALID_EMAIL_MESSAGE, isValidEmail } from '../src/lib/email';
import { isSupabaseConfigured } from '../src/lib/env';
import { useAuth } from '../src/context/AuthContext';
import { colors, fonts, spacing } from '../src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const localMode = !isSupabaseConfigured();

  async function handleSubmit() {
    setError('');
    if (!email.trim()) {
      setError('Introduce tu correo electrónico.');
      return;
    }
    if (!isValidEmail(email)) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el correo de recuperación.');
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
            kicker="Recuperar acceso"
            title="¿Olvidaste tu contraseña?"
            subtitle={
              localMode
                ? 'En modo demo local no hay envío de correo. Usa la cuenta demo o crea una nueva.'
                : 'Escribe el correo con el que te registraste y te enviaremos un enlace para crear una contraseña nueva.'
            }
          />

          {localMode && !sent ? (
            <View style={styles.localBox}>
              <Text style={styles.localText}>
                Prueba con la cuenta demo desde Iniciar sesión, o crea una cuenta nueva en Registro.
              </Text>
              <ActionButton label="Ir a iniciar sesión" variant="secondary" onPress={() => router.replace('/login')} />
            </View>
          ) : null}

          {sent ? (
            <>
              <Text style={styles.message}>
                Si existe una cuenta con <Text style={styles.bold}>{email.trim()}</Text>, te hemos
                enviado un correo con un enlace para restablecer tu contraseña. Revisa tu bandeja de
                entrada (y la carpeta de spam).
              </Text>
              <ActionButton label="Volver a iniciar sesión" onPress={() => router.replace('/login')} />
            </>
          ) : !localMode ? (
            <>
              <FormField
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="tu@correo.com"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <ActionButton
                label={loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                onPress={handleSubmit}
                disabled={loading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya la recuerdas?</Text>
                <Link href="/login" asChild>
                  <Pressable>
                    <Text style={styles.link}>Iniciar sesión</Text>
                  </Pressable>
                </Link>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const font = fonts.family ? { fontFamily: fonts.family } : {};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  localBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  localText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  message: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  bold: { color: colors.text, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14, ...font },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  footerText: { color: colors.textMuted, fontSize: 14, ...font },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700', ...font },
});
