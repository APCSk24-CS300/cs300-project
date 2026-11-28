import { AuthProvider } from "@/features/auth/provider/AuthProvider";
import { MockProvider } from "@/mocks/MockProvider";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <MockProvider>
      <AuthProvider>{children}</AuthProvider>
    </MockProvider>
  );
}
