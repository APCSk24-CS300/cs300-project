import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

type TagProps = {
  children: ReactNode;
  className?: string;
};

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-guide-gradient-to px-2.5 py-1 text-xs font-medium text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
