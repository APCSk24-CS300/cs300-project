"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/libs/cn";
import { inputClasses, type TextInputProps } from "@/components/ui/TextInput";

export const PasswordInput = forwardRef<HTMLInputElement, Omit<TextInputProps, "type">>(function PasswordInput(
  { className, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(inputClasses, "pr-20", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-1 right-1 rounded-xl px-3 text-sm font-semibold text-primary hover:bg-hover-tint"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
});
