"use client";

import { AuthContext } from "@/features/auth/context/AuthContext";
import { mockAuthService } from "@/features/auth/services/mock.auth.service";
import { SessionUser } from "@/features/auth/types/auth";
import { LoginRequest } from "@/features/auth/types/auth.dto";
import { useState, useCallback, useEffect, useMemo } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authServiceInstance = mockAuthService;
  const removeUser = useCallback(async () => {
    setUser(null);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setIsLoading(true);
        const response = await authServiceInstance.login(data);
        if (response.user != null) {
          setUser(response.user);
          console.log(response.user);
          return response.user;
        }
        throw new Error("Login failed: user is null");
      } catch (error) {
        await removeUser();
        console.error("Login failed", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [authServiceInstance, removeUser],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authServiceInstance.logout();
      await removeUser();
    } catch (error) {
      console.error("Logout failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authServiceInstance, removeUser]);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authServiceInstance.getMe();
      if (response) {
        setUser(response);
      }
    } catch (error) {
      await removeUser();
      console.error("Refresh user failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authServiceInstance, removeUser]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error("Failed to initialize user", error);
      }
    };

    void initializeUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
      isLoading,
    }),
    [user, login, logout, refreshUser, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
