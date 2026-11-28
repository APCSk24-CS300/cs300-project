"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/libs/cn";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  /** Escape or a close action. The dialog never closes itself. */
  onClose: () => void;
  className?: string;
};

/**
 * Modal panel on the native <dialog> (same behaviour as ConfirmDialog): focus moves to the first
 * field or button inside, Escape calls `onClose`, focus returns to the opener on close.
 */
export function Dialog({ open, title, description, children, onClose, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("input, textarea, select, button")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        "m-auto w-[min(92vw,36rem)] rounded-card bg-surface p-6 text-text shadow-card backdrop:bg-overlay/40",
        className,
      )}
    >
      <h2 id={titleId} className="text-lg font-semibold text-heading">
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className="mt-1 text-sm text-text-muted">
          {description}
        </p>
      ) : null}
      {open ? <div className="mt-5">{children}</div> : null}
    </dialog>
  );
}
