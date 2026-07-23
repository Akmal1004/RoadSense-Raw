import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthCredentials, RegisterData, ResetPasswordData, UserProfile } from "../types/auth";
import { apiService } from "./apiService";

const STORAGE_KEYS = {
  currentUser: "roadsense:auth:current-user",
  usersList: "roadsense:auth:users-list",
  resetCodes: "roadsense:auth:reset-codes"
};

export const defaultSeedUser: UserProfile = {
  id: "usr_default_01",
  name: "Alex Morgan",
  email: "alex.morgan@roadsense.ai",
  phone: "+91 98765 43210",
  avatar: "account-circle",
  vehicleModel: "Tesla Model 3 / CyberTruck",
  emergencyContact: "+91 98765 00911",
  bio: "Safety-first commuter & road trip enthusiast exploring smart AI navigation.",
  joinedDate: "July 2024",
  memberTier: "Pro Navigator"
};

interface StoredAccount {
  profile: UserProfile;
  passwordHash: string;
}

export const authService = {
  /**
   * Restores active user session from AsyncStorage.
   * If none exists, seeds the default user for a seamless initial experience.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.currentUser);
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
      // Seed default user on first app launch
      await this.saveCurrentUser(defaultSeedUser);
      return defaultSeedUser;
    } catch (error) {
      console.warn("[RoadSense Auth] Failed to restore current user", error);
      return defaultSeedUser;
    }
  },

  async saveCurrentUser(user: UserProfile | null): Promise<void> {
    try {
      if (!user) {
        await AsyncStorage.removeItem(STORAGE_KEYS.currentUser);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
      }
    } catch (error) {
      console.warn("[RoadSense Auth] Failed to save current user", error);
    }
  },

  async getRegisteredAccounts(): Promise<Record<string, StoredAccount>> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.usersList);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch {
      return {};
    }
  },

  async registerUserAccount(data: RegisterData, customProfile?: UserProfile): Promise<UserProfile> {
    // Attempt backend registration via XAMPP Express API
    try {
      const result = await apiService.register(data);
      if (result && result.user) {
        await this.saveCurrentUser(result.user);
        return result.user;
      }
    } catch (apiError) {
      console.info("[Auth] Express backend registration offline/failed, proceeding with local persistence.", apiError);
    }

    // Local Storage Fallback
    const accounts = await this.getRegisteredAccounts();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (accounts[normalizedEmail] && !customProfile) {
      throw new Error("An account with this email address already exists.");
    }

    const newUserProfile: UserProfile = customProfile || {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone?.trim() || "+91 98765 43210",
      avatar: "account-circle",
      vehicleModel: data.vehicleModel?.trim() || "Electric Vehicle",
      emergencyContact: "+91 98765 00911",
      bio: "Active RoadSense Driver",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      memberTier: "Standard Member"
    };

    accounts[normalizedEmail] = {
      profile: newUserProfile,
      passwordHash: data.password || "password123"
    };

    await AsyncStorage.setItem(STORAGE_KEYS.usersList, JSON.stringify(accounts));
    await this.saveCurrentUser(newUserProfile);
    return newUserProfile;
  },

  async login(credentials: AuthCredentials): Promise<UserProfile> {
    // Attempt backend login via XAMPP Express API
    try {
      const result = await apiService.login(credentials);
      if (result && result.user) {
        await this.saveCurrentUser(result.user);
        return result.user;
      }
    } catch (apiError: any) {
      if (apiError.message?.includes("Incorrect password") || apiError.message?.includes("No account found")) {
        throw apiError;
      }
      console.info("[Auth] Express backend login offline, trying local storage.", apiError);
    }

    // Local Storage Fallback
    const accounts = await this.getRegisteredAccounts();
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const account = accounts[normalizedEmail];

    if (!account) {
      if (normalizedEmail === defaultSeedUser.email.toLowerCase()) {
        await this.saveCurrentUser(defaultSeedUser);
        return defaultSeedUser;
      }
      throw new Error("No account found with this email. Please check or Create an Account.");
    }

    if (credentials.password && account.passwordHash !== credentials.password) {
      throw new Error("Incorrect password. Please check your password or use 'Forgot Password'.");
    }

    await this.saveCurrentUser(account.profile);
    return account.profile;
  },

  async requestPasswordResetCode(email: string): Promise<string> {
    // Attempt backend request via XAMPP Express API
    try {
      const result = await apiService.requestResetCode(email);
      if (result && result.code) {
        return result.code;
      }
    } catch (apiError) {
      console.info("[Auth] Express backend reset code offline, proceeding with local fallback.", apiError);
    }

    // Local Storage Fallback
    const normalizedEmail = email.trim().toLowerCase();
    const accounts = await this.getRegisteredAccounts();

    if (!accounts[normalizedEmail] && normalizedEmail !== defaultSeedUser.email.toLowerCase()) {
      throw new Error("No registered account found with this email address.");
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    const resetCodes = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.resetCodes)) || "{}");
    resetCodes[normalizedEmail] = resetCode;

    await AsyncStorage.setItem(STORAGE_KEYS.resetCodes, JSON.stringify(resetCodes));
    return resetCode;
  },

  async resetPassword({ email, code, newPassword }: ResetPasswordData): Promise<void> {
    // Attempt backend reset via XAMPP Express API
    try {
      await apiService.resetPassword({ email, code, newPassword });
      return;
    } catch (apiError) {
      console.info("[Auth] Express backend reset offline, using local fallback.", apiError);
    }

    // Local Storage Fallback
    const normalizedEmail = email.trim().toLowerCase();
    const resetCodes = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.resetCodes)) || "{}");

    const validCode = resetCodes[normalizedEmail];
    if (!validCode || validCode !== code.trim()) {
      throw new Error("Invalid or expired reset code. Please request a new code.");
    }

    const accounts = await this.getRegisteredAccounts();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].passwordHash = newPassword || "password123";
      await AsyncStorage.setItem(STORAGE_KEYS.usersList, JSON.stringify(accounts));
    }

    delete resetCodes[normalizedEmail];
    await AsyncStorage.setItem(STORAGE_KEYS.resetCodes, JSON.stringify(resetCodes));
  },

  async updateProfile(updatedFields: Partial<UserProfile>): Promise<UserProfile> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("No active user session found.");

    const updatedUser: UserProfile = {
      ...currentUser,
      ...updatedFields
    };

    // Attempt backend profile update via XAMPP Express API
    try {
      const result = await apiService.updateProfile(currentUser.id, updatedFields);
      if (result && result.user) {
        await this.saveCurrentUser(result.user);
        return result.user;
      }
    } catch (apiError) {
      console.info("[Auth] Express backend profile update offline, saving locally.", apiError);
    }

    await this.saveCurrentUser(updatedUser);

    const accounts = await this.getRegisteredAccounts();
    const normalizedEmail = updatedUser.email.toLowerCase();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].profile = updatedUser;
      await AsyncStorage.setItem(STORAGE_KEYS.usersList, JSON.stringify(accounts));
    }

    return updatedUser;
  },

  async logout(): Promise<void> {
    await this.saveCurrentUser(null);
  }
};
