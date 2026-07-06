import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { assertValidEmail, normalizeEmail } from '../lib/email';
import {
  assertLoginAllowed,
  assertStrongPassword,
  clearLoginAttempts,
  recordFailedLogin,
} from '../lib/security/passwordPolicy';
import { authErrorMessage } from '../lib/security/sanitize';
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
import { getSupabase } from '../lib/supabase/client';
import { LEGAL_VERSION } from '../lib/legal';
import { deleteUserAccount, exportUserData } from '../lib/supabase/accountRepository';
import { syncOwnProfile } from '../lib/backend/profileSync';
import { flushQueuedReports } from '../lib/backend/reports';
import {
  fetchProfileByUserId,
  findProfilesByDisplayName,
  searchProfilesSafe,
  updateProfile,
} from '../lib/supabase/profileRepository';

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

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
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
    const sb = getSupabase();
    let active = true;

    const finishLoading = () => {
      if (active) setIsLoading(false);
    };

    // Red de seguridad: nunca dejar la app colgada en el spinner si
    // getSession() no resuelve (p. ej. sesión corrupta o bloqueo de lock en web).
    const safety = setTimeout(finishLoading, 2000);

    (async () => {
      try {
        const { data } = await sb.auth.getSession();
        if (active && data.session?.user) {
          const profile = await fetchProfileByUserId(data.session.user.id);
          if (active && profile) {
            setUser({
              ...profile,
              vehicles: normalizeVehicles(profile.vehicles),
            });
            void syncOwnProfile(profile);
            setDirectory((prev) => {
              const next = new Map(prev);
              next.set(normalizeEmail(profile.email), {
                email: profile.email,
                name: profile.name,
              });
              return next;
            });
          }
        }
      } catch {
        // Ignoramos: mostramos el login y dejamos reintentar.
      } finally {
        clearTimeout(safety);
        finishLoading();
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      // IMPORTANTE: no hacer llamadas a Supabase (que necesitan el token y por
      // tanto el lock de auth) dentro del callback de onAuthStateChange, porque
      // se ejecuta dentro de ese mismo lock y provoca un deadlock que deja el
      // login colgado. Diferimos el trabajo fuera del callback.
      const userId = session.user.id;
      setTimeout(() => {
        if (!active) return;
        void fetchProfileByUserId(userId).then((profile) => {
          if (active && profile) {
            setUser({
              ...profile,
              vehicles: normalizeVehicles(profile.vehicles),
            });
            void syncOwnProfile(profile);
          }
        });
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  const persist = useCallback(async (next: User) => {
    setUser(next);
    await updateProfile(next.id, {
      name: next.name,
      avatarUrl: next.avatarUrl,
      socials: next.socials,
      vehicles: next.vehicles,
      vehicleType: next.vehicleType,
      fuelPref: next.fuelPref,
    });
    void syncOwnProfile(next);
    setDirectory((prev) => {
      const map = new Map(prev);
      map.set(normalizeEmail(next.email), { email: next.email, name: next.name });
      return map;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    assertValidEmail(email);
    assertLoginAllowed();
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) {
      recordFailedLogin();
      throw new Error(authErrorMessage(error));
    }
    clearLoginAttempts();
    // Usamos la sesión devuelta directamente: llamar a getSession() justo
    // después puede bloquearse por el lock de auth de supabase-js en web.
    if (!data.session?.user) throw new Error('No se pudo iniciar sesión.');
    const profile = await fetchProfileByUserId(data.user.id);
    if (!profile) throw new Error('Perfil no encontrado.');
    const hydrated = { ...profile, vehicles: normalizeVehicles(profile.vehicles) };
    setUser(hydrated);
    void syncOwnProfile(hydrated);
    void flushQueuedReports();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    assertValidEmail(email);
    assertStrongPassword(password);
    const sb = getSupabase();
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
    const remoteMatches = await findProfilesByDisplayName(displayName);
    for (const profile of remoteMatches) {
      takenNames.push(profile.name);
      emailsByName.set(profile.name, profile.email);
    }
    assertDisplayNameAvailable(displayName, takenNames, key, emailsByName);
    const { data, error } = await sb.auth.signUp({
      email: key,
      password,
      options: {
        data: {
          name: displayName,
          terms_accepted_at: new Date().toISOString(),
          terms_version: LEGAL_VERSION,
          privacy_version: LEGAL_VERSION,
        },
      },
    });
    if (error) throw new Error(authErrorMessage(error));
    if (!data.user) throw new Error('No se pudo crear la cuenta.');
    if (!data.session) {
      throw new Error(
        'Cuenta creada. Te hemos enviado un correo para confirmarla: ábrelo y luego inicia sesión.',
      );
    }
    const profile = await fetchProfileByUserId(data.user.id);
    const newUser: User = profile ?? {
      id: data.user.id,
      name: displayName,
      email: key,
      createdAt: new Date().toISOString(),
      socials: normalizeSocials(),
      vehicles: [],
    };
    const hydrated = { ...newUser, vehicles: normalizeVehicles(newUser.vehicles) };
    setUser(hydrated);
    void syncOwnProfile(hydrated);
  }, []);

  const logout = useCallback(() => {
    void getSupabase().auth.signOut();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    assertValidEmail(email);
    const sb = getSupabase();
    const redirectTo = Linking.createURL('reset-password');
    const { error } = await sb.auth.resetPasswordForEmail(normalizeEmail(email), {
      redirectTo,
    });
    if (error) throw new Error(authErrorMessage(error));
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    assertStrongPassword(newPassword);
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw new Error(authErrorMessage(error));
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
    const res = await deleteUserAccount();
    if (!res.ok) throw new Error(res.error);
    setUser(null);
  }, []);

  const exportAccountData = useCallback(async () => {
    const res = await exportUserData();
    if (!res.ok) throw new Error(res.error);
    return res.value;
  }, []);

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

  useEffect(() => {
    if (!user) return;
    void searchProfilesSafe(user.name.slice(0, 2)).then((rows) => {
      setDirectory((prev) => {
        const next = new Map(prev);
        rows.forEach((row) => next.set(normalizeEmail(row.email), row));
        if (user) next.set(normalizeEmail(user.email), { email: user.email, name: user.name });
        return next;
      });
    });
  }, [user?.email, user?.name]);

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

export function useSupabaseAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('SupabaseAuthProvider requerido');
  return ctx;
}
