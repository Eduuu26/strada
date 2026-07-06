import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

type CookieConsentContextValue = {
  visible: boolean;
  height: number;
  setVisible: (visible: boolean) => void;
  setHeight: (height: number) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export const WEB_TAB_BAR_HEIGHT = 68;

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(0);

  const value = useMemo(
    () => ({ visible, height, setVisible, setHeight }),
    [visible, height],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent debe usarse dentro de CookieConsentProvider');
  }
  return ctx;
}

/** Espacio extra al final de scrolls en web cuando el banner de cookies está visible. */
export function useCookieConsentInset(extra = 0): number {
  const { visible, height } = useCookieConsent();
  if (Platform.OS !== 'web' || !visible) return extra;
  return extra + (height || 120);
}
