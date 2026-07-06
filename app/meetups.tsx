import { Redirect } from 'expo-router';

// Alias para la URL /meetups → pestaña de Quedadas (events).
export default function MeetupsRedirect() {
  return <Redirect href="/(tabs)/events" />;
}
