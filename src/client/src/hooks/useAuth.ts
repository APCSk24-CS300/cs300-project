`use client`;

import { AuthContext } from "@/contexts/auth-context";
import { useContext } from "react";

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("Function useAuth() must be used within an AuthProvider");
    }

    return context;
}
