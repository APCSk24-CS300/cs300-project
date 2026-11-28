"use client"; // needs the useAuth hook

import { ForbiddenView } from "@/components/layout/ForbiddenView";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/libs/navigation";

/** No-permission page inside the shell (FR-020). */
export default function ForbiddenPage() {
  const { user } = useAuth();
  return <ForbiddenView dashboardHref={getDashboardPath(user?.role)} />;
}
