import { AuthProvider} from "@/providers/AuthProvider";

interface ProviderProps {
    children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}