import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../src/components/ActionButton';
import { FormField } from '../src/components/FormField';
import { LegalFooter } from '../src/components/LegalFooter';
import { ScreenHero } from '../src/components/ScreenHero';
import { useAuth } from '../src/context/AuthContext';
import { INVALID_EMAIL_MESSAGE, isValidEmail } from '../src/lib/email';
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../src/lib/security/passwordPolicy';
import { validateDisplayNameFormat } from '../src/lib/security/displayName';
import { getPrivacyPolicyUrl } from '../src/lib/env';
import { getTermsUrl, openLegalUrl } from '../src/lib/legal';
import { colors, radius, spacing } from '../src/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginHref =
    typeof redirect === 'string' && redirect.startsWith('/')
      ? `/login?redirect=${encodeURIComponent(redirect)}`
      : '/login';

  async function handleSubmit() {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!accepted) {
      setError('Debes aceptar los términos y la privacidad.');
      return;
    }
    if (!ageConfirmed) {
      setError('Debes confirmar que tienes al menos 16 años.');
      return;
    }
    if (!isValidEmail(email)) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }
    const nameError = validateDisplayNameFormat(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      const dest = typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/(tabs)/profile';
      router.replace(dest as '/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
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
            kicker="Nueva cuenta"
            title="Crear cuenta"
            subtitle="Únete para organizar quedadas, guardar rutas favoritas y conducir en grupo por España."
          />

          <View style={styles.field}>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu alias público (único)"
              placeholderTextColor={colors.textMuted}
              maxLength={24}
            />
          </View>

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
            placeholder="Mín. 10 caracteres, mayúscula, minúscula y número"
          />

          <FormField
            label="Repetir contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            holdToRevealPassword
            placeholder="Repite la contraseña"
          />

          <Pressable style={styles.checkRow} onPress={() => setAccepted((v) => !v)}>
            <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
              {accepted ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkText}>
              Acepto los{' '}
              <Text style={styles.link} onPress={() => openLegalUrl(getTermsUrl())}>
                términos de uso
              </Text>{' '}
              y la{' '}
              <Text style={styles.link} onPress={() => openLegalUrl(getPrivacyPolicyUrl())}>
                política de privacidad
              </Text>
            </Text>
          </Pressable>

          <Pressable style={styles.checkRow} onPress={() => setAgeConfirmed((v) => !v)}>
            <View style={[styles.checkbox, ageConfirmed && styles.checkboxOn]}>
              {ageConfirmed ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkText}>Confirmo que tengo al menos 16 años</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <ActionButton
            label={loading ? 'Creando cuenta…' : 'Crear cuenta'}
            onPress={handleSubmit}
            disabled={loading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <Link href={loginHref as '/login'} asChild>
              <Pressable>
                <Text style={styles.link}>Iniciar sesión</Text>
              </Pressable>
            </Link>
          </View>

          <LegalFooter compact />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  field: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    fontSize: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  checkText: { color: colors.textMuted, fontSize: 13, lineHeight: 18, flex: 1 },
  error: { color: colors.danger, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
