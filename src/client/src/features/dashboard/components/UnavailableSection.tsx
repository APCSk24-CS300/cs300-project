import { SurfaceCard } from "@/components/ui/SurfaceCard";

/** A summary without a contract endpoint: never shows invented numbers (UC-32 A2, FR-025). */
export function UnavailableSection({ title }: { title: string }) {
  return (
    <SurfaceCard className="flex min-h-32 flex-col justify-between p-5">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      <p className="text-sm text-text-muted">Not yet available</p>
    </SurfaceCard>
  );
}
