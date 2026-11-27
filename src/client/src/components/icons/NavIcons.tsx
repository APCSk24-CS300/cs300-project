import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ChevronDownIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.833 10H4.167m0 0L9.167 5m-5 5 5 5" />
    </svg>
  );
}

export function CheckIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden="true" className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export function LogoutIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 17.5H4.167A1.667 1.667 0 0 1 2.5 15.833V4.167A1.667 1.667 0 0 1 4.167 2.5H7.5m5.833 11.667L17.5 10l-4.167-4.167M17.5 10h-10" />
    </svg>
  );
}

export function NavItemIcon({ id, className = "size-4 shrink-0" }: { id: string; className?: string }) {
  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
          <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
          <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
          <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.5v-1.25a3 3 0 0 0-3-3h-5a3 3 0 0 0-3 3v1.25M8 9.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9.5 7.25v-1.25a3 3 0 0 0-2.25-2.9M13 3.35a3 3 0 0 1 0 5.8" />
        </svg>
      );
    case "activities":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5h12M4 10h12M4 14.5h7.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <rect x="2.5" y="3.75" width="15" height="13.75" rx="2" />
          <path strokeLinecap="round" d="M6.5 2v3.5M13.5 2v3.5M2.5 8h15" />
        </svg>
      );
    case "registrations":
    case "attendance":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5 9.5 12.5 13 8.5M4.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15V5a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      );
    case "drs":
    case "scores":
    case "score":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m10 2.5 2.2 4.46 4.92.72-3.56 3.47.84 4.9L10 13.73l-4.4 2.32.84-4.9-3.56-3.47 4.92-.72L10 2.5Z" />
        </svg>
      );
    case "appeals":
    case "requests":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H7.5L4 17.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 16.5h13M6 13.5V9.5m4 4V5.5m4 8V7.5" />
        </svg>
      );
    case "assistant":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5v2m0 11v2M4.7 4.7l1.4 1.4m7.8 7.8 1.4 1.4M2.5 10h2m11 0h2M4.7 15.3l1.4-1.4m7.8-7.8 1.4-1.4" />
          <circle cx="10" cy="10" r="2.75" />
        </svg>
      );
    case "services":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5h14M4.5 16.5V7.5L10 4l5.5 3.5v9M8 16.5v-4h4v4" />
        </svg>
      );
    case "categories":
    case "configuration":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.5h11m-11 7h11M7.5 4v5m5 2v5" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 5.5V10l2.75 1.75M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <circle cx="10" cy="7" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5a5.5 5.5 0 0 1 11 0" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true" className={className}>
          <circle cx="10" cy="10" r="6.5" />
        </svg>
      );
  }
}
