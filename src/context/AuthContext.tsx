import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AuthCredentials, RegisterData, ResetPasswordData, UserProfile } from "../types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<UserProfile>;
  requestResetCode: (email: string) => Promise<string>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  updateProfile: (updatedFields: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.warn("[AuthContext] Failed to load initial user", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,

      async login(credentials) {
        setIsLoading(true);
        try {
          const loggedInUser = await authService.login(credentials);
          setUser(loggedInUser);
          return loggedInUser;
        } finally {
          setIsLoading(false);
        }
      },

      async register(data) {
        setIsLoading(true);
        try {
          const newUser = await authService.registerUserAccount(data);
          setUser(newUser);
          return newUser;
        } finally {
          setIsLoading(false);
        }
      },

      async requestResetCode(email) {
        return await authService.requestPasswordResetCode(email);
      },

      async resetPassword(data) {
        await authService.resetPassword(data);
      },

      async updateProfile(updatedFields) {
        const updated = await authService.updateProfile(updatedFields);
        setUser(updated);
        return updated;
      },

      async logout() {
        setIsLoading(true);
        try {
          await authService.logout();
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
