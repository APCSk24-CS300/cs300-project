import { forwardRef, type ReactNode } from "react";
import { cn } from "@/libs/cn";

export type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-info/30 bg-info-surface text-info",
  success: "border-success/30 bg-success/5 text-success",
  warning: "border-warning/30 bg-warning/5 text-warning",
  error: "border-danger/30 bg-danger-surface text-danger",
};

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

/** Inline notice. Errors use role="alert" (announced), others role="status". */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, children, className },
  ref,
) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3 text-sm outline-none", variantClasses[variant], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
});
