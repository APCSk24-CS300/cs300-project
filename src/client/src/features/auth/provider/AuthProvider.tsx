"use client";

import { AuthContext } from "@/features/auth/context/AuthContext";
import { RoleCode } from "@/libs/roles";
import { authService } from "@/features/auth/services/auth.service";
import { mockAuthService } from "@/features/auth/services/mock.auth.service";
import { SessionUser } from "@/features/auth/types/auth";
import { LoginRequest } from "@/features/auth/types/auth.dto";
import { useState, useCallback, useEffect, useMemo } from "react";
import { set } from "zod";



interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const authServiceInstance = mockAuthService;
    const removeUser = async () => {
        // (await cookies()).delete('session')
        setUser(null);
    }
    const login = useCallback(async (data: LoginRequest) => {
        try {
            setIsLoading(true);
            const response = await authServiceInstance.login(data);
            if (response.user != null) {
                setUser(response.user);
                return response.user;
            }
            throw new Error("Login failed: user is null");
        } catch (error) {
            //placeholder for later error handling
            await removeUser();

            console.error("Login failed", error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            await authServiceInstance.logout();
            await removeUser();

        }
        catch (error) {
            //placeholder for later error handling
            console.error("Logout failed", error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, []);


    const refreshUser = useCallback(async () => {
        try {
            console.log("Refreshing user...");
            setIsLoading(true);

            const response = await authServiceInstance.getMe();
            if (response) {
                setUser(response);
            }
        }
        catch (error) {
            //placeholder for later error handling
            await removeUser();

            console.error("Refresh user failed", error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, []);

    // get user 
    useEffect(() => {
        const initializeUser = async () => {
            try {
                await refreshUser();

                console.log("User initialized:", user);
            }
            catch (error) {
                console.error("Failed to initialize user", error);
            }
        }

        initializeUser();
    }, [refreshUser]);

    const value = useMemo(
        () => ({ user, isAuthenticated: user !== null, login, logout, refreshUser, isLoading }),
        [user, login, logout],
    );
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}