import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/libs/cn";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
};

type FormFieldProps = {
  label: string;
  /** Shows "Required" or "Optional" next to the label (NFR-USA-05). */
  required?: boolean;
  /** Hide the Required/Optional label suffix (e.g. for search/filter controls). */
  hideRequirementBadge?: boolean;
  /** Typography scale: "default" preserves login form; "comfortable" uses 15px labels & 14px hints for app pages. */
  size?: "default" | "comfortable";
  hint?: string;
  error?: string;
  /** The single input/select/textarea element. Receives id + aria wiring. */
  children: ReactElement<FieldControlProps>;
  className?: string;
  id?: string;
  /** Extra content under the control (e.g. a retry button). */
  footer?: ReactNode;
};

export function FormField({
  label,
  required = false,
  hideRequirementBadge = false,
  size = "default",
  hint,
  error,
  children,
  className,
  id,
  footer,
}: FormFieldProps) {
  const autoId = useId();
  const controlId = id ?? children.props.id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const comfortable = size === "comfortable";

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={controlId}
        className={cn(
          "flex items-baseline justify-between gap-3 font-semibold text-heading",
          comfortable ? "text-[15px]" : "text-sm",
        )}
      >
        <span>{label}</span>
        {hideRequirementBadge ? null : (
          <span className={cn("font-normal text-text-muted", comfortable ? "text-[13px]" : "text-xs")}>
            {required ? "Required" : "Optional"}
          </span>
        )}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className={cn("text-text-muted", comfortable ? "text-sm" : "text-xs")}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {footer}
    </div>
  );
}
