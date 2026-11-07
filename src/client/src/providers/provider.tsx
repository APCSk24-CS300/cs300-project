import { AuthProvider } from "@/features/auth/provider/AuthProvider";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}