import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import {
  HELP_CONTENT,
  type GuideEntry,
} from "@/features/landing/config/guides";
import { cn } from "@/libs/cn";

type GuideCardProps = {
  guide: GuideEntry;
};

export function GuideCard({ guide }: GuideCardProps) {
  const content = (
    <>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-text">{guide.title}</h3>
        <p className="mt-1 text-sm text-text-muted">{guide.subtitle}</p>
        {!guide.available ? (
          <Badge tone="neutral" className="mt-2 text-[11px]">
            {HELP_CONTENT.unavailableLabel}
          </Badge>
        ) : null}
      </div>
      <ArrowRightIcon
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0",
          guide.available ? "text-primary" : "text-text-muted/60",
        )}
      />
    </>
  );

  if (guide.available && guide.href) {
    return (
      <Link
        href={guide.href}
        className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-guide-gradient-from to-guide-gradient-to px-6 py-5 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {content}
      </Link>
    );
  }

  return (
    <SurfaceCard
      gradient
      className="flex min-h-24 items-center justify-between gap-4 border border-slate-200/80 px-6 py-5"
    >
      {content}
    </SurfaceCard>
  );
}
