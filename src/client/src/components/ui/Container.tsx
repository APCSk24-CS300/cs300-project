import type { ElementType, ReactNode } from "react";
import { cn } from "@/libs/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
};

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  const Element = Component as ElementType;

  return (
    <Element
      className={cn(
        "mx-auto w-full max-w-landing px-[var(--page-gutter)]",
        className,
      )}
    >
      {children}
    </Element>
  );
}
