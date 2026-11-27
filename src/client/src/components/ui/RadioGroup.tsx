import { useId } from "react";
import { cn } from "@/libs/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

type RadioGroupProps = {
  legend: string;
  name: string;
  options: RadioOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
};

/** Single-choice group (fieldset/legend). Used for the one-role rule (FR-031). */
export function RadioGroup({ legend, name, options, value, onChange, required = false, error, className }: RadioGroupProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      className={cn("flex flex-col gap-2", className)}
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 flex w-full items-baseline justify-between gap-3 text-[15px] font-semibold text-heading">
        <span>{legend}</span>
        <span className="text-[13px] font-normal text-text-muted">{required ? "Required" : "Optional"}</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-[15px] transition-colors",
                checked ? "border-primary bg-info-surface/30 text-primary" : "border-border text-heading hover:border-primary",
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-semibold">{option.label}</span>
                {option.description ? <span className="mt-0.5 block text-[13px] leading-snug text-text-muted">{option.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
