import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { CookieConsentBanner } from '../src/components/CookieConsentBanner';
import { CookieConsentProvider } from '../src/context/CookieConsentContext';
import { AppDataProviders } from '../src/context/AppDataProviders';
import { FeedProvider } from '../src/context/FeedContext';
import { colors, layout, shadows } from '../src/theme';
import { isSupabaseConfigured } from '../src/lib/env';
import { shouldUseStradaAuth } from '../src/lib/backend/config';
import { STRADA_SESSION_KEY } from '../src/lib/backend/sessionStorage';
import { CLUB_SEARCH_RADIUS_STORAGE_KEY } from '../src/lib/clubSearchRadius';
import { LOGIN_ATTEMPTS_KEY } from '../src/lib/security/passwordPolicy';
import { hydrateAppStorage } from '../src/lib/persistentStorage';
import { hydrateClubSearchRadius } from '../src/lib/clubSearchRadius';
import { ensureCarMatchNotificationHandler } from '../src/lib/carMatch/notify';
import { CAR_MATCH_LIKES_KEY, CAR_MATCH_SWIPES_KEY } from '../src/lib/carMatch/storage';
import { SOCIAL_FOLLOWS_KEY, SOCIAL_FRIEND_REQUESTS_KEY } from '../src/lib/social/storage';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured() && !shouldUseStradaAuth()) return;
    if (isLoading) return;
    const authRoutes = new Set(['login', 'register', 'forgot-password', 'reset-password']);
    const seg0 = segments[0] ?? '';
    const inAuth = authRoutes.has(seg0);
    const protectedRoots = new Set(['chat', 'community', 'create-route', 'create-meetup', 'create-club']);
    if (!user && !inAuth && protectedRoots.has(seg0)) {
      router.replace(`/login?redirect=/${seg0}`);
    } else if (user && (seg0 === 'login' || seg0 === 'register')) {
      // Ya autenticado: salir de las pantallas de acceso hacia la app. Hace que
      // la transición tras iniciar sesión sea fiable sin depender del timing.
      router.replace('/(tabs)/profile');
    }
  }, [user, isLoading, segments, router]);

  if ((isSupabaseConfigured() || shouldUseStradaAuth()) && isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return children;
}

function WebShell({ children }: { children: React.ReactNode }) {
  // En web/escritorio limitamos el ancho a una columna tipo móvil y la
  // centramos. Sin esto, las imágenes (con aspectRatio a ancho completo) se
  // vuelven enormes y los formularios quedan desproporcionados. En nativo no
  // aplicamos nada (ocupa toda la pantalla).
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.webColumn}>
        {children}
        <CookieConsentBanner />
      </View>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    ensureCarMatchNotificationHandler();
    void hydrateAppStorage([
      LOGIN_ATTEMPTS_KEY,
      CLUB_SEARCH_RADIUS_STORAGE_KEY,
      CAR_MATCH_LIKES_KEY,
      CAR_MATCH_SWIPES_KEY,
      SOCIAL_FOLLOWS_KEY,
      SOCIAL_FRIEND_REQUESTS_KEY,
      STRADA_SESSION_KEY,
    ]).then(() => hydrateClubSearchRadius());
  }, []);

  return (
    <CookieConsentProvider>
    <AuthProvider>
      <AppDataProviders>
        <FeedProvider>
          <AuthGate>
            <StatusBar style="light" />
            <WebShell>
            <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routes" options={{ headerShown: false }} />
          <Stack.Screen name="meetups" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Iniciar sesión', presentation: 'modal' }} />
          <Stack.Screen name="register" options={{ title: 'Crear cuenta', presentation: 'modal' }} />
          <Stack.Screen
            name="forgot-password"
            options={{ title: 'Recuperar contraseña', presentation: 'modal' }}
          />
          <Stack.Screen
            name="reset-password"
            options={{ title: 'Nueva contraseña', presentation: 'card' }}
          />
          <Stack.Screen name="create-route" options={{ title: 'Crear ruta', presentation: 'modal' }} />
          <Stack.Screen name="create-meetup" options={{ title: 'Organizar quedada', presentation: 'modal' }} />
          <Stack.Screen name="create-club" options={{ title: 'Crear club', presentation: 'modal' }} />
          <Stack.Screen name="community/create" options={{ title: 'Crear comunidad', presentation: 'modal' }} />
          <Stack.Screen name="community/new-route" options={{ title: 'Crear ruta', presentation: 'modal' }} />
          <Stack.Screen name="community/[id]" options={{ title: 'Comunidad', presentation: 'card' }} />
          <Stack.Screen name="route/[id]" options={{ title: 'Ruta', presentation: 'card' }} />
          <Stack.Screen name="meetup/[id]" options={{ title: 'Quedada', presentation: 'card' }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Chat', presentation: 'card' }} />
          <Stack.Screen name="club/[id]" options={{ title: 'Club', presentation: 'card' }} />
          <Stack.Screen name="user/[email]" options={{ title: 'Perfil', presentation: 'card' }} />
        </Stack>
            </WebShell>
          </AuthGate>
        </FeedProvider>
      </AppDataProviders>
    </AuthProvider>
    </CookieConsentProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#06080b',
    ...Platform.select({
      web: {
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,112,58,0.08), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(40,60,90,0.15), transparent)',
      },
      default: {},
    }),
  },
  webColumn: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    backgroundColor: colors.background,
    position: 'relative',
    ...(Platform.OS === 'web' ? shadows.shell : {}),
  },
});
