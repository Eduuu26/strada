import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let handlerSet = false;

export function ensureCarMatchNotificationHandler(): void {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** Notificación local cuando alguien le da like a tu coche (best-effort). */
export async function notifyCarLiked(fromName: string, vehicleLabel: string): Promise<void> {
  ensureCarMatchNotificationHandler();
  try {
    if (Platform.OS !== 'web') {
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain) {
        await Notifications.requestPermissionsAsync();
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Le gusta tu coche!',
        body: `${fromName} le ha gustado tu ${vehicleLabel}`,
        data: { type: 'car_like' },
      },
      trigger: null,
    });
  } catch {
    /* push opcional */
  }
}
