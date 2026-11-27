import type { RoleCode } from "@/libs/roles";

export interface DashboardSection {
  id: string;
  title: string;
  /** No contract operation yet (spec GAP-J, DOC-15): shown as "Not yet available". */
  status: "unavailable";
  ucRef: string;
}

/** UC-32 A3–A5 summary sections per role (draft). */
export const DASHBOARD_SECTIONS: Record<RoleCode, DashboardSection[]> = {
  student: [
    { id: "upcoming", title: "Upcoming activities", status: "unavailable", ucRef: "UC-32 A3" },
    { id: "registrations", title: "Registration status", status: "unavailable", ucRef: "UC-32 A3" },
    { id: "score", title: "Training score", status: "unavailable", ucRef: "UC-32 A3" },
    { id: "requests", title: "My requests", status: "unavailable", ucRef: "UC-32 A3" },
  ],
  manager: [
    { id: "activities", title: "My activities", status: "unavailable", ucRef: "UC-32 A4" },
    { id: "registrations", title: "Registrations", status: "unavailable", ucRef: "UC-32 A4" },
    { id: "upcoming", title: "Upcoming activities", status: "unavailable", ucRef: "UC-32 A4" },
    { id: "verifications", title: "Pending verifications", status: "unavailable", ucRef: "UC-32 A4" },
  ],
  administrator: [
    { id: "activity", title: "System activity", status: "unavailable", ucRef: "UC-32 A5" },
    { id: "registrations", title: "Registrations", status: "unavailable", ucRef: "UC-32 A5" },
    { id: "participation", title: "Verified participation", status: "unavailable", ucRef: "UC-32 A5" },
    { id: "scores", title: "Training scores", status: "unavailable", ucRef: "UC-32 A5" },
  ],
};
