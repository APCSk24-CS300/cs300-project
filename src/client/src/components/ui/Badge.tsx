import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

type BadgeTone = "success" | "warning" | "neutral" | "info";

type BadgeProps = {
  tone: BadgeTone;
  withDot?: boolean;
  children: ReactNode;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  success: "text-success",
  warning: "text-warning",
  neutral: "text-neutral-status",
  info: "text-primary",
};

export function Badge({
  tone,
  withDot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-current"
        />
      ) : null}
      <span>{children}</span>
    </span>
  );
}
