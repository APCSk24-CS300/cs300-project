"use client";

import { AuthContext } from "@/contexts/AuthContext";
import { RoleCode } from "@/libs/roles";
import { authService } from "@/services/auth.service";
import { mockAuthService } from "@/services/mock.auth.service";
import { SessionUser } from "@/types";
import { useState, useCallback, useEffect } from "react";



interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const authServiceInstance = mockAuthService;

    const login = async (role: RoleCode, email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await authServiceInstance.login({ role, email, password });
            if (response.user != null) {
                setUser(response.user);
            }
        } catch (error) {
            //placeholder for later error handling
            setUser(null);
            console.error("Login failed", error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }
        ;

    const logout = async () => {
        try {
            setIsLoading(true);

            await authServiceInstance.logout();
            setUser(null);
        }
        catch (error) {
            //placeholder for later error handling
            console.error("Logout failed", error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    };


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
            setUser(null);
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

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}