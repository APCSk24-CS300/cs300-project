"use client"; // needs the useAuth hook (C-I allows client components for hooks)

import { useAuth } from "@/hooks/useAuth";
import { RoleDashboard } from "@/features/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  return user ? <RoleDashboard user={user} /> : null;
}
