import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../context/AuthContext';
import { getBackendProvider } from '../lib/backend/config';
import { registerPushToken } from '../lib/backend/pushSync';
import { isSupabaseConfigured } from '../lib/env';
import { upsertPushToken } from '../lib/supabase/pushTokensRepository';

function currentPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Registra el token de Expo Push del dispositivo para el usuario actual y lo
 * guarda en Strada API o Supabase según el proveedor activo.
 */
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Device.isDevice) return;
    const provider = getBackendProvider();
    if (provider === 'local') return;
    if (provider === 'supabase' && !isSupabaseConfigured()) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let granted = existing.granted;
        if (!granted && existing.canAskAgain) {
          const req = await Notifications.requestPermissionsAsync();
          granted = req.granted;
        }
        if (!granted) return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Avisos',
            importance: Notifications.AndroidImportance.HIGH,
          });
        }

        const projectId =
          (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
            ?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

        if (!projectId) return;

        const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenResp.data;
        if (cancelled || !token) return;

        const platform = currentPlatform();
        if (provider === 'strada-api') {
          await registerPushToken(token, platform);
        } else {
          await upsertPushToken(user.id, token, platform);
        }
      } catch {
        // best-effort: no bloquea el arranque de la app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
}
