import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton } from '../src/components/ActionButton';
import { FormField } from '../src/components/FormField';
import { ScreenHero } from '../src/components/ScreenHero';
import { useAuth } from '../src/context/AuthContext';
import { isSupabaseConfigured } from '../src/lib/env';
import { updatePasswordWithAccessToken } from '../src/lib/supabase/passwordRecovery';
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../src/lib/security/passwordPolicy';
import { colors, radius, spacing } from '../src/theme';

type ParsedRecovery =
  | { accessToken: string }
  | { error: string }
  | null;

function parseRecoveryFromUrl(url: string | null): ParsedRecovery {
  if (!url) return null;
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const fragment =
    hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const errorDescription = params.get('error_description');
  if (errorDescription) return { error: errorDescription };
  const accessToken = params.get('access_token');
  if (accessToken) return { accessToken };
  return null;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, updatePassword } = useAuth();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // Sin Supabase (modo local) permitimos el cambio si hay usuario.
        if (!isSupabaseConfigured()) {
          if (active) setReady(Boolean(user));
          return;
        }

        let url: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          url = window.location.href;
        } else {
          url = await Linking.getInitialURL();
        }
        const parsed = parseRecoveryFromUrl(url);

        if (parsed && 'error' in parsed) {
          if (active) setError('El enlace no es válido o ha caducado. Solicita uno nuevo.');
        } else if (parsed && parsed.accessToken) {
          if (active) {
            setAccessToken(parsed.accessToken);
            setReady(true);
          }
          // Limpiamos el token de la URL para que no quede visible.
          if (
            Platform.OS === 'web' &&
            typeof window !== 'undefined' &&
            window.history?.replaceState
          ) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else if (active && user) {
          // Usuario ya autenticado que quiere cambiar su contraseña.
          setReady(true);
        }
      } catch {
        if (active) setError('No se pudo validar el enlace de recuperación.');
      } finally {
        if (active) setChecking(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleSubmit() {
    setError('');
    if (!password || !confirm) {
      setError('Completa ambos campos.');
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
    setLoading(true);
    try {
      if (accessToken) {
        await updatePasswordWithAccessToken(accessToken, password);
      } else {
        await updatePassword(password);
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.');
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
            kicker="Nueva contraseña"
            title="Restablecer contraseña"
            subtitle={
              done
                ? 'Tu contraseña se ha actualizado correctamente.'
                : ready
                  ? 'Escribe tu nueva contraseña.'
                  : 'Validando el enlace de recuperación…'
            }
          />

          {checking ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={styles.subtitle}>Validando el enlace…</Text>
            </View>
          ) : done ? (
            <>
              <ActionButton label="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
              {user ? (
                <ActionButton
                  label="Ir a mi perfil"
                  variant="secondary"
                  onPress={() => router.replace('/(tabs)/profile')}
                />
              ) : null}
            </>
          ) : ready ? (
            <>
              <FormField
                label="Nueva contraseña"
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

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <ActionButton
                label={loading ? 'Guardando…' : 'Guardar contraseña'}
                onPress={handleSubmit}
                disabled={loading}
              />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {error ||
                  'Este enlace no es válido o ha caducado. Solicita un nuevo enlace de recuperación.'}
              </Text>
              <Link href="/forgot-password" asChild>
                <Pressable>
                  <Text style={styles.link}>Solicitar un nuevo enlace</Text>
                </Pressable>
              </Link>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
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
  error: { color: colors.danger, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
