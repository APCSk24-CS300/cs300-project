import Link from "next/link";
import { cn } from "@/libs/cn";

type LogoProps = {
  variant?: "default" | "light";
  href?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function Logo({
  variant = "default",
  href = "/",
  className,
  onClick,
}: LogoProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="myHCMUS home"
      className={cn(
        "inline-flex items-baseline text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="font-serif italic text-accent-gold">my</span>
      <span className={variant === "light" ? "text-white" : "text-primary"}>
        HCMUS
      </span>
    </Link>
  );
}
