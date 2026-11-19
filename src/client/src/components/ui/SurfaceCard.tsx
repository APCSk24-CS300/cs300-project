import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

type SurfaceCardProps = {
  children: ReactNode;
  gradient?: boolean;
  className?: string;
};

export function SurfaceCard({
  children,
  gradient = false,
  className,
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface shadow-card",
        gradient &&
          "bg-gradient-to-b from-guide-gradient-from to-guide-gradient-to",
        className,
      )}
    >
      {children}
    </div>
  );
}
