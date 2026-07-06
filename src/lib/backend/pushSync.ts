import { getBackendProvider } from './config';
import { stradaApiFetch } from './httpClient';

export type PushPlatform = 'ios' | 'android' | 'web';

export async function registerPushToken(token: string, platform: PushPlatform): Promise<boolean> {
  if (getBackendProvider() !== 'strada-api') return false;
  const res = await stradaApiFetch('/api/v1/push-tokens', {
    method: 'POST',
    body: { token, platform },
  });
  return res.ok;
}
