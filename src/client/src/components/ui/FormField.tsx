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
  hint?: string;
  error?: string;
  /** The single input/select/textarea element. Receives id + aria wiring. */
  children: ReactElement<FieldControlProps>;
  className?: string;
  id?: string;
  /** Extra content under the control (e.g. a retry button). */
  footer?: ReactNode;
};

export function FormField({ label, required = false, hint, error, children, className, id, footer }: FormFieldProps) {
  const autoId = useId();
  const controlId = id ?? children.props.id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

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
      <label htmlFor={controlId} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-heading">
        <span>{label}</span>
        <span className="text-xs font-normal text-text-muted">{required ? "Required" : "Optional"}</span>
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs text-text-muted">
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
