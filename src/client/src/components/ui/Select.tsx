import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/libs/cn";
import { inputClasses } from "@/components/ui/TextInput";

export interface SelectOption {
  value: string;
  label: string;
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cn(inputClasses, "appearance-auto pr-8", className)} {...rest}>
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
