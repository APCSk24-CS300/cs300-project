import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/libs/cn";

export const inputClasses =
  "h-12 w-full rounded-2xl border-2 border-border bg-surface px-4 text-base text-heading outline-none transition-colors placeholder:text-placeholder focus:border-primary aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, type = "text", ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cn(inputClasses, className)} {...rest} />;
});
