import * as Notifications from 'expo-notifications';

import { usePushRegistration } from '../hooks/usePushRegistration';

// Muestra los avisos también cuando la app está en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Componente sin UI: registra el token push del usuario actual. */
export function PushRegistrar() {
  usePushRegistration();
  return null;
}
