import type { ReactNode } from "react";
import { cn } from "@/libs/cn";

type SectionProps = {
  id?: string;
  labelledBy?: string;
  background?: "none" | "primary-dark";
  children: ReactNode;
  className?: string;
};

export function Section({
  id,
  labelledBy,
  background = "none",
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "scroll-mt-[calc(var(--header-height)+2rem)] py-16",
        background === "primary-dark" && "bg-primary-dark text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}
