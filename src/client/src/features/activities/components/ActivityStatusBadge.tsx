import { REGISTRATION_STATUS_LABELS } from "@/features/activities/config";
import type { RegistrationStatus } from "@/features/activities/types";
import { Badge } from "@/components/ui/Badge";

const STATUS_TONES = {
  open: "success",
  upcoming: "warning",
  closed: "neutral",
} as const;

type ActivityStatusBadgeProps = {
  status: RegistrationStatus;
};

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  return (
    <Badge tone={STATUS_TONES[status]} withDot>
      {REGISTRATION_STATUS_LABELS[status]}
    </Badge>
  );
}
