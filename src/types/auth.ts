export type UserAvatar = 'account-circle' | 'account-cowboy-hat' | 'account-tie' | 'account-hard-hat' | 'shield-account' | 'racing-helmet';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  vehicleModel: string;
  emergencyContact?: string;
  bio?: string;
  joinedDate: string;
  memberTier: string;
}

export interface AuthCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  vehicleModel?: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
