"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/TextInput";
import { cn } from "@/libs/cn";

type CopyFieldProps = {
  label: string;
  value: string;
};

/** Read-only value with a copy button and a polite "Copied" announcement. */
export function CopyField({ label, value }: CopyFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied");
    } catch {
      inputRef.current?.select();
      setStatus("Press Ctrl+C to copy");
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(inputClasses, "font-mono")}
        />
        <Button variant="white" onClick={copy}>
          Copy
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-xs text-success">
        {status}
      </p>
    </div>
  );
}
