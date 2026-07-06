import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { assertValidEmail, normalizeEmail } from '../lib/email';
import {
  assertLoginAllowed,
  assertStrongPassword,
  clearLoginAttempts,
  recordFailedLogin,
} from '../lib/security/passwordPolicy';
import {
  assertDisplayNameAvailable,
  sanitizeDisplayName,
} from '../lib/security/displayName';
import { normalizeSocials } from '../lib/socials';
import { getSeedDirectoryEntry, getSeedPublicProfile, SEED_PROFILE_DIRECTORY } from '../data/seedProfiles';
import { normalizeUserVehicle, vehicleFromFormInput } from '../data/vehicles';
import type { User, UserSocials, UserVehicle, VehicleFormInput } from '../types';
import { AuthContext } from './authShared';
import type { ProfilePreferences } from './authShared';
import {
  sessionFromPayload,
  stradaDeleteAccount,
  stradaExportAccount,
  stradaFetchMe,
  stradaLogin,
  stradaRegister,
  stradaUpdatePassword,
} from '../lib/backend/authApi';
import { flushQueuedReports } from '../lib/backend/reports';
import { syncOwnProfile } from '../lib/backend/profileSync';
import {
  clearStradaSession,
  isStradaSessionValid,
  readStradaSession,
  writeStradaSession,
} from '../lib/backend/sessionStorage';

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

export function StradaAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [directory, setDirectory] = useState<Map<string, { email: string; name: string }>>(() => {
    const initial = new Map<string, { email: string; name: string }>();
    for (const entry of SEED_PROFILE_DIRECTORY) {
      initial.set(normalizeEmail(entry.email), entry);
    }
    return initial;
  });

  useEffect(() => {
    let active = true;
    const safety = setTimeout(() => {
      if (active) setIsLoading(false);
    }, 2500);

    (async () => {
      try {
        const session = readStradaSession();
        if (!isStradaSessionValid(session)) {
          if (session) await clearStradaSession();
          return;
        }
        const me = await stradaFetchMe();
        if (active && me) {
          const hydrated = { ...me, vehicles: normalizeVehicles(me.vehicles) };
          setUser(hydrated);
          setDirectory((prev) => {
            const next = new Map(prev);
            next.set(normalizeEmail(hydrated.email), { email: hydrated.email, name: hydrated.name });
            return next;
          });
        } else if (session) {
          await clearStradaSession();
        }
      } finally {
        clearTimeout(safety);
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      clearTimeout(safety);
    };
  }, []);

  const persist = useCallback(async (next: User) => {
    setUser(next);
    await syncOwnProfile(next);
    setDirectory((prev) => {
      const map = new Map(prev);
      map.set(normalizeEmail(next.email), { email: next.email, name: next.name });
      return map;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    assertValidEmail(email);
    assertLoginAllowed();
    const result = await stradaLogin(normalizeEmail(email), password);
    if (!result.ok) {
      recordFailedLogin();
      throw new Error(result.error);
    }
    clearLoginAttempts();
    await writeStradaSession(sessionFromPayload(result.data));
    const hydrated = { ...result.data.user, vehicles: normalizeVehicles(result.data.user.vehicles) };
    setUser(hydrated);
    void flushQueuedReports();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    assertValidEmail(email);
    assertStrongPassword(password);
    const key = normalizeEmail(email);
    const displayName = sanitizeDisplayName(name);
    const takenNames: string[] = [];
    const emailsByName = new Map<string, string>();
    for (const entry of directory.values()) {
      takenNames.push(entry.name);
      emailsByName.set(entry.name, entry.email);
    }
    for (const entry of SEED_PROFILE_DIRECTORY) {
      takenNames.push(entry.name);
      emailsByName.set(entry.name, entry.email);
    }
    assertDisplayNameAvailable(displayName, takenNames, key, emailsByName);

    const result = await stradaRegister(displayName, key, password);
    if (!result.ok) throw new Error(result.error);

    await writeStradaSession(sessionFromPayload(result.data));
    const hydrated = { ...result.data.user, vehicles: normalizeVehicles(result.data.user.vehicles) };
    setUser(hydrated);
  }, [directory]);

  const logout = useCallback(() => {
    void clearStradaSession();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    assertValidEmail(email);
    throw new Error(
      'El restablecimiento por correo estará disponible pronto con auth Strada. Contacta con soporte si lo necesitas ya.',
    );
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    assertStrongPassword(newPassword);
    const result = await stradaUpdatePassword(newPassword);
    if (!result.ok) throw new Error(result.error);
  }, []);

  const updateUser = useCallback(
    (updater: (current: User) => User) => {
      setUser((current) => {
        if (!current) return current;
        const next = updater(current);
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateAvatar = useCallback(
    (avatarUrl: string) => updateUser((c) => ({ ...c, avatarUrl })),
    [updateUser],
  );

  const removeAvatar = useCallback(
    () => updateUser((c) => ({ ...c, avatarUrl: undefined })),
    [updateUser],
  );

  const addVehicle = useCallback(
    (input: VehicleFormInput) => {
      const base = vehicleFromFormInput(input);
      let created: UserVehicle = { id: `veh_${Date.now()}`, ...base };
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
          (current.vehicles ?? []).map((v) => (v.id === id ? { ...v, ...base } : v)),
        ),
      }));
    },
    [updateUser],
  );

  const removeVehicle = useCallback(
    (id: string) => {
      updateUser((current) => ({
        ...current,
        vehicles: normalizeVehicles((current.vehicles ?? []).filter((v) => v.id !== id)),
      }));
    },
    [updateUser],
  );

  const setDefaultVehicle = useCallback(
    (id: string) => {
      updateUser((current) => ({
        ...current,
        vehicles: normalizeVehicles(
          (current.vehicles ?? []).map((v) => ({ ...v, isDefault: v.id === id })),
        ),
      }));
    },
    [updateUser],
  );

  const updateSocials = useCallback(
    (socials: UserSocials) => updateUser((c) => ({ ...c, socials: normalizeSocials(socials) })),
    [updateUser],
  );

  const updatePreferences = useCallback(
    (prefs: ProfilePreferences) =>
      updateUser((c) => ({
        ...c,
        vehicleType: prefs.vehicleType ?? c.vehicleType,
        fuelPref: prefs.fuelPref ?? c.fuelPref,
      })),
    [updateUser],
  );

  const deleteAccount = useCallback(async () => {
    const res = await stradaDeleteAccount();
    if (!res.ok) throw new Error(res.error);
    await clearStradaSession();
    setUser(null);
  }, []);

  const exportAccountData = useCallback(async () => stradaExportAccount(), []);

  const findUserByEmail = useCallback(
    (email: string) => {
      const key = normalizeEmail(email);
      return directory.get(key) ?? getSeedDirectoryEntry(key);
    },
    [directory],
  );

  const getUserProfileByEmail = useCallback(
    (email: string) => {
      const key = normalizeEmail(email);
      if (user && user.email === key) {
        return {
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          vehicles: normalizeVehicles(user.vehicles),
          socials: user.socials,
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
      const dir = directory.get(key);
      if (!dir) return undefined;
      return { email: dir.email, name: dir.name, vehicles: [] as UserVehicle[] };
    },
    [user, directory],
  );

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
