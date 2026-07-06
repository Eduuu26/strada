import { Redirect } from 'expo-router';

// Alias para la URL /routes → pestaña de Rutas (índice de tabs).
export default function RoutesRedirect() {
  return <Redirect href="/(tabs)" />;
}
