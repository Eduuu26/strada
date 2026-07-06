import { createContext, useContext } from 'react';
import type {
  FuelPreference,
  User,
  UserSocials,
  UserVehicle,
  VehicleFormInput,
  VehiclePreference,
} from '../types';

export type ProfilePreferences = {
  vehicleType?: VehiclePreference;
  fuelPref?: FuelPreference;
};

export type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  removeAvatar: () => void;
  addVehicle: (input: VehicleFormInput) => UserVehicle;
  updateVehicle: (id: string, input: VehicleFormInput) => void;
  removeVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  updateSocials: (socials: UserSocials) => void;
  updatePreferences: (prefs: ProfilePreferences) => void;
  /** RGPD: elimina la cuenta y datos asociados. */
  deleteAccount: () => Promise<void>;
  /** RGPD art. 20: exportación de datos personales. */
  exportAccountData: () => Promise<Record<string, unknown>>;
  findUserByEmail: (email: string) => { email: string; name: string } | undefined;
  getUserProfileByEmail: (
    email: string,
  ) =>
    | {
        email: string;
        name: string;
        avatarUrl?: string;
        vehicles: UserVehicle[];
        socials?: UserSocials;
      }
    | undefined;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
