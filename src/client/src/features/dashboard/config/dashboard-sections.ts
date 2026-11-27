import type { RoleCode } from "@/libs/roles";

export interface DashboardSection {
  id: string;
  title: string;
  description: string;
  /** No contract operation yet (spec GAP-J, DOC-15): shown as "Not yet available". */
  status: "unavailable";
  ucRef: string;
}

/** UC-32 A3–A5 summary sections per role (draft). Note: keep descriptions free of digits. */
export const DASHBOARD_SECTIONS: Record<RoleCode, DashboardSection[]> = {
  student: [
    {
      id: "upcoming",
      title: "Upcoming activities",
      description: "Confirmed sessions on your schedule",
      status: "unavailable",
      ucRef: "UC-32 A3",
    },
    {
      id: "registrations",
      title: "Registration status",
      description: "Pending, waitlisted, and confirmed sign-ups",
      status: "unavailable",
      ucRef: "UC-32 A3",
    },
    {
      id: "score",
      title: "Training score",
      description: "Current semester score and criterion progress",
      status: "unavailable",
      ucRef: "UC-32 A3",
    },
    {
      id: "requests",
      title: "My requests",
      description: "Activity recognition and score appeal updates",
      status: "unavailable",
      ucRef: "UC-32 A3",
    },
  ],
  manager: [
    {
      id: "activities",
      title: "My activities",
      description: "Draft, published, and ongoing events",
      status: "unavailable",
      ucRef: "UC-32 A4",
    },
    {
      id: "registrations",
      title: "Registrations",
      description: "Participant sign-ups and waiting lists",
      status: "unavailable",
      ucRef: "UC-32 A4",
    },
    {
      id: "upcoming",
      title: "Upcoming activities",
      description: "Next scheduled sessions under your scope",
      status: "unavailable",
      ucRef: "UC-32 A4",
    },
    {
      id: "verifications",
      title: "Pending verifications",
      description: "Attendance and appeal reviews awaiting action",
      status: "unavailable",
      ucRef: "UC-32 A4",
    },
  ],
  administrator: [
    {
      id: "activity",
      title: "System activity",
      description: "Recent platform events and organization trends",
      status: "unavailable",
      ucRef: "UC-32 A5",
    },
    {
      id: "registrations",
      title: "Registrations",
      description: "Campus-wide activity enrollment summary",
      status: "unavailable",
      ucRef: "UC-32 A5",
    },
    {
      id: "participation",
      title: "Verified participation",
      description: "Confirmed attendance across faculties",
      status: "unavailable",
      ucRef: "UC-32 A5",
    },
    {
      id: "scores",
      title: "Training scores",
      description: "Semester training-score distribution",
      status: "unavailable",
      ucRef: "UC-32 A5",
    },
  ],
};
