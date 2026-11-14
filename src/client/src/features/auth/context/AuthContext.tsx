
// provide a context for authentication state and methods


import { SessionUser } from '@/features/auth/types/auth';
import { LoginRequest } from '@/features/auth/types/auth.dto';
import { createContext } from 'react';

export interface AuthContextValue {
    user: SessionUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (data: LoginRequest) => Promise<SessionUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
