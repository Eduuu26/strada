import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured } from '../lib/env';
import { shouldUseStradaAuth } from '../lib/backend/config';
import { SupabaseAuthProvider } from './SupabaseAuthProvider';
import { StradaAuthProvider } from './StradaAuthProvider';
import { assertValidEmail, normalizeEmail } from '../lib/email';
import {
  assertLoginAllowed,
  assertStrongPassword,
  clearLoginAttempts,
  recordFailedLogin,
} from '../lib/security/passwordPolicy';
import { getSeedPublicProfile } from '../data/seedProfiles';
import { SEED_PROFILE_DIRECTORY } from '../data/seedProfiles';
import { normalizeUserVehicle, vehicleFromFormInput } from '../data/vehicles';
import { normalizeSocials } from '../lib/socials';
import {
  assertDisplayNameAvailable,
  sanitizeDisplayName,
} from '../lib/security/displayName';
import { AuthContext, useAuth } from './authShared';
import type { ProfilePreferences } from './authShared';
import type { User, UserSocials, UserVehicle, VehicleFormInput } from '../types';

export { useAuth };
export type { ProfilePreferences, AuthContextValue } from './authShared';

/** Contraseña de la cuenta demo en modo local (sin Supabase). */
export const DEMO_ACCOUNT_EMAIL = 'carlos@strada.es';
export const DEMO_ACCOUNT_PASSWORD = 'StradaDemo1!';

const users = new Map<string, { user: User; password: string }>();

const SEED_DIRECTORY: { email: string; name: string }[] = [
  { email: 'admin1@strada.com', name: 'Admin 1' },
  { email: 'admin2@strada.com', name: 'Admin 2' },
  { email: 'carlos@strada.es', name: 'Carlos R.' },
  { email: 'laura@strada.es', name: 'Laura M.' },
  { email: 'miguel@strada.es', name: 'Miguel S.' },
  { email: 'ana@strada.es', name: 'Ana G.' },
  { email: 'pedro@strada.es', name: 'Pedro L.' },
];

const userDirectory = new Map(
  SEED_DIRECTORY.map((entry) => [normalizeEmail(entry.email), entry]),
);

function collectTakenDisplayNames(): {
  names: string[];
  emailsByName: Map<string, string>;
} {
  const names: string[] = [];
  const emailsByName = new Map<string, string>();
  const add = (name: string, email: string) => {
    names.push(name);
    emailsByName.set(name, email);
  };
  for (const entry of SEED_DIRECTORY) add(entry.name, entry.email);
  for (const entry of SEED_PROFILE_DIRECTORY) add(entry.name, entry.email);
  for (const record of users.values()) add(record.user.name, record.user.email);
  for (const entry of userDirectory.values()) add(entry.name, entry.email);
  return { names, emailsByName };
}

function registerInDirectory(user: { email: string; name: string }) {
  userDirectory.set(normalizeEmail(user.email), {
    email: normalizeEmail(user.email),
    name: user.name,
  });
}

function normalizeVehicles(vehicles: UserVehicle[] = []): UserVehicle[] {
  if (!vehicles.length) return [];
  const hasDefault = vehicles.some((v) => v.isDefault);
  return vehicles.map((v, index) =>
    normalizeUserVehicle({
      ...v,
      isDefault: hasDefault ? !!v.isDefault : index === 0,
    }),
  );
}

function persistUser(user: User) {
  const record = users.get(user.email);
  if (record) {
    users.set(user.email, { ...record, user });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (shouldUseStradaAuth()) {
    return <StradaAuthProvider>{children}</StradaAuthProvider>;
  }
  if (isSupabaseConfigured()) {
    return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  useEffect(() => {
    const email = normalizeEmail(DEMO_ACCOUNT_EMAIL);
    if (users.has(email)) return;
    const seed = getSeedPublicProfile(email);
    if (!seed) return;
    const demoUser: User = {
      id: 'demo_carlos',
      name: seed.name,
      email,
      avatarUrl: seed.avatarUrl,
      vehicles: normalizeVehicles(seed.vehicles),
      socials: normalizeSocials(seed.socials),
      createdAt: '2026-01-01T00:00:00Z',
    };
    users.set(email, { user: demoUser, password: DEMO_ACCOUNT_PASSWORD });
    registerInDirectory(demoUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    assertValidEmail(email);
    assertLoginAllowed();
    const key = normalizeEmail(email);
    const record = users.get(key);
    if (!record || record.password !== password) {
      recordFailedLogin();
      throw new Error('Correo o contraseña incorrectos.');
    }
    clearLoginAttempts();
    setUser({
      ...record.user,
      socials: normalizeSocials(record.user.socials),
      vehicles: normalizeVehicles(record.user.vehicles ?? []),
    });
    registerInDirectory(record.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    assertValidEmail(email);
    assertStrongPassword(password);
    const key = normalizeEmail(email);
    if (users.has(key)) {
      throw new Error('Ya existe una cuenta con ese correo.');
    }
    const displayName = sanitizeDisplayName(name);
    const { names, emailsByName } = collectTakenDisplayNames(key);
    assertDisplayNameAvailable(displayName, names, key, emailsByName);
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: displayName,
      email: key,
      createdAt: new Date().toISOString(),
      socials: normalizeSocials(),
      vehicles: [],
    };
    users.set(key, { user: newUser, password });
    registerInDirectory(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    assertValidEmail(email);
    // Modo local (sin Supabase): no hay envío real de correo.
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    assertStrongPassword(newPassword);
    setUser((current) => {
      if (!current) return current;
      const record = users.get(current.email);
      if (record) {
        users.set(current.email, { ...record, password: newPassword });
      }
      return current;
    });
  }, []);

  const updateUser = useCallback((updater: (current: User) => User) => {
    setUser((current) => {
      if (!current) return current;
      const next = updater(current);
      persistUser(next);
      return next;
    });
  }, []);

  const updateAvatar = useCallback(
    (avatarUrl: string) => {
      updateUser((current) => ({ ...current, avatarUrl }));
    },
    [updateUser],
  );

  const removeAvatar = useCallback(() => {
    updateUser((current) => ({ ...current, avatarUrl: undefined }));
  }, [updateUser]);

  const addVehicle = useCallback(
    (input: VehicleFormInput) => {
      const base = vehicleFromFormInput(input);
      let created: UserVehicle = {
        id: `veh_${Date.now()}`,
        ...base,
      };
      updateUser((current) => {
        const vehicles = normalizeVehicles(current.vehicles ?? []);
        const isFirst = vehicles.length === 0;
        created = { ...created, isDefault: isFirst };
        return { ...current, vehicles: [...vehicles, created] };
      });
      return created;
    },
    [updateUser],
  );

  const updateVehicle = useCallback(
    (id: string, input: VehicleFormInput) => {
      const base = vehicleFromFormInput(input);
      updateUser((current) => ({
        ...current,
        vehicles: normalizeVehicles(
          (current.vehicles ?? []).map((vehicle) =>
            vehicle.id === id ? { ...vehicle, ...base } : vehicle,
          ),
        ),
      }));
    },
    [updateUser],
  );

  const removeVehicle = useCallback(
    (id: string) => {
      updateUser((current) => ({
        ...current,
        vehicles: normalizeVehicles((current.vehicles ?? []).filter((vehicle) => vehicle.id !== id)),
      }));
    },
    [updateUser],
  );

  const setDefaultVehicle = useCallback(
    (id: string) => {
      updateUser((current) => ({
        ...current,
        vehicles: normalizeVehicles(
          (current.vehicles ?? []).map((vehicle) => ({
            ...vehicle,
            isDefault: vehicle.id === id,
          })),
        ),
      }));
    },
    [updateUser],
  );

  const updateSocials = useCallback(
    (socials: UserSocials) => {
      updateUser((current) => ({ ...current, socials: normalizeSocials(socials) }));
    },
    [updateUser],
  );

  const updatePreferences = useCallback(
    (prefs: ProfilePreferences) => {
      updateUser((current) => ({
        ...current,
        vehicleType: prefs.vehicleType ?? current.vehicleType,
        fuelPref: prefs.fuelPref ?? current.fuelPref,
      }));
    },
    [updateUser],
  );

  const deleteAccount = useCallback(async () => {
    setUser((current) => {
      if (current) users.delete(current.email);
      return null;
    });
  }, []);

  const exportAccountData = useCallback(async (): Promise<Record<string, unknown>> => {
    if (!user) throw new Error('Inicia sesión para exportar tus datos.');
    return {
      exportedAt: new Date().toISOString(),
      format: 'strada-local-export-v1',
      profile: user,
    };
  }, [user]);

  const findUserByEmail = useCallback((email: string) => {
    return userDirectory.get(normalizeEmail(email));
  }, []);

  const getUserProfileByEmail = useCallback((email: string) => {
    const key = normalizeEmail(email);
    const record = users.get(key);
    if (record) {
      return {
        email: record.user.email,
        name: record.user.name,
        avatarUrl: record.user.avatarUrl,
        vehicles: normalizeVehicles(record.user.vehicles ?? []),
        socials: normalizeSocials(record.user.socials),
      };
    }
    const seed = getSeedPublicProfile(key);
    if (seed) {
      return {
        email: seed.email,
        name: seed.name,
        avatarUrl: seed.avatarUrl,
        vehicles: normalizeVehicles(seed.vehicles),
        socials: seed.socials,
      };
    }
    const dir = userDirectory.get(key);
    if (!dir) return undefined;
    return { email: dir.email, name: dir.name, vehicles: [] as UserVehicle[] };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      requestPasswordReset,
      updatePassword,
      updateAvatar,
      removeAvatar,
      addVehicle,
      updateVehicle,
      removeVehicle,
      setDefaultVehicle,
      updateSocials,
      updatePreferences,
      deleteAccount,
      exportAccountData,
      findUserByEmail,
      getUserProfileByEmail,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      requestPasswordReset,
      updatePassword,
      updateAvatar,
      removeAvatar,
      addVehicle,
      updateVehicle,
      removeVehicle,
      setDefaultVehicle,
      updateSocials,
      updatePreferences,
      deleteAccount,
      exportAccountData,
      findUserByEmail,
      getUserProfileByEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
