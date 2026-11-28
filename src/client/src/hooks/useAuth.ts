'use client';

import { AuthContext } from "@/features/auth/context/AuthContext";
import { useContext } from "react";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("Function useAuth() must be used within an AuthProvider");
    }

    return context;
}
