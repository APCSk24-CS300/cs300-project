
// provide a context for authentication state and methods


import { SessionUser } from '@/types';
import  { createContext } from 'react';

export interface AuthContextValue {
    user: SessionUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
