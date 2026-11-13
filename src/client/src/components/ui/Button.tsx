import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";
import { cn } from "@/libs/cn";

type ButtonVariant = "primary" | "secondary" | "white" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLElement>;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "onClick"
>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-dark disabled:hover:bg-primary",
  secondary:
    "bg-primary-dark text-white shadow-sm hover:bg-primary disabled:hover:bg-primary-dark",
  white:
    "bg-surface text-primary shadow-card hover:bg-guide-gradient-to disabled:hover:bg-surface",
  ghost:
    "bg-transparent text-text hover:bg-black/5 disabled:hover:bg-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-5 text-sm",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-12 px-8 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  target,
  rel,
  onClick,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || isLoading;
  const classes = cn(
    "inline-flex min-w-11 items-center justify-center gap-2 rounded-pill font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = (
    <>
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </>
  );

  if (href && !isDisabled) {
    return (
      <Link
        href={href}
        className={classes}
        target={target}
        rel={rel}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        aria-busy={isLoading || undefined}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <span
        className={classes}
        aria-disabled="true"
        aria-busy={isLoading || undefined}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      aria-busy={isLoading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
