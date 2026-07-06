import { isProductionApp } from './env';

export type AnalyticsEvent =
  | 'sign_up'
  | 'login'
  | 'route_join'
  | 'route_create'
  | 'meetup_join'
  | 'match_like'
  | 'post_create'
  | 'report_submit'
  | 'vehicle_add';

type Props = Record<string, string | number | boolean | undefined>;

const listeners: ((event: AnalyticsEvent, props?: Props) => void)[] = [];

/** Registra un listener (p. ej. futuro SDK de analytics). */
export function onAnalyticsEvent(listener: (event: AnalyticsEvent, props?: Props) => void): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function trackEvent(event: AnalyticsEvent, props?: Props): void {
  if (__DEV__) {
    console.debug('[analytics]', event, props ?? {});
  }
  for (const listener of listeners) {
    try {
      listener(event, props);
    } catch {
      // no-op
    }
  }
  if (isProductionApp() && typeof globalThis !== 'undefined') {
    const w = globalThis as { gtag?: (...args: unknown[]) => void };
    w.gtag?.('event', event, props);
  }
}
