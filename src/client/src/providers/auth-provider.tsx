

import { AuthContext } from "@/contexts/auth-context";
import { authService } from "@/services/auth.service";
import { SessionUser } from "@/types";
import { useState, useCallback, useEffect } from "react";



interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await authService.login({ email, password });
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

            await authService.logout();
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
            setIsLoading(true);

            const response = await authService.getMe();
            if (response){
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
            }
            catch (error) {
                console.error("Failed to initialize user", error);
            }
        }

        initializeUser();
    }, [refreshUser]);

    return (
        <AuthContext.Provider value = {{ user, isAuthenticated: user !== null, isLoading, login, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
      );
}