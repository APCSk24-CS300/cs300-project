import type { MockDb, MockPermission, MockServiceLink, MockUser } from "@/mocks/db/types";

/** Password of every seeded account (use-case-specifications §5.1 demo accounts). */
export const SEED_PASSWORD = "demo2026";

/**
 * Not a stored user: the login handler always answers 503 for this email (UC-01 A5).
 * Checked before any user lookup.
 */
export const OUTAGE_EMAIL = "outage@example.invalid";

/** Hub permission codes (src/db/hub_schema.sql ids 910-911): read = every role, manage = administrator. */
export const HUB_READ = "hub.services.read";
export const HUB_MANAGE = "hub.services.manage";
export const HUB_PERMISSIONS: MockPermission[] = [
  { id: "perm-hub-read", code: HUB_READ, description: "View the University Services Hub" },
  { id: "perm-hub-manage", code: HUB_MANAGE, description: "Add, edit, deactivate and reactivate university service links" },
];

/**
 * The six agreed HCMUS links plus the inactive university website, as a fresh database has them
 * (src/db/hub_schema.sql + seed.sql; spec 004 FR-018).
 */
const SERVICE_LINK_SEED: Omit<MockServiceLink, "version">[] = [
  { id: "1", name: "Moodle", url: "https://courses.ctda.hcmus.edu.vn/", description: "Courses, assignments and lecture materials", displayOrder: 1, isActive: true },
  { id: "2", name: "Student Portal", url: "https://student.hcmus.edu.vn/login", description: "Student information, timetable and grades", displayOrder: 2, isActive: true },
  { id: "3", name: "Course Registration Portal", url: "https://new-portal4.hcmus.edu.vn/Login.aspx", description: "Course registration, timetable and results", displayOrder: 3, isActive: true },
  { id: "4", name: "Special Programs Portal", url: "https://portal.ctdb.hcmus.edu.vn/Login", description: "Portal for special training programs", displayOrder: 4, isActive: true },
  { id: "5", name: "Tuition Payment", url: "https://hocphi.hcmus.edu.vn/", description: "Pay tuition and check payment status", displayOrder: 5, isActive: true },
  { id: "6", name: "Student Handbook 2025", url: "https://hcmus.edu.vn/wp-content/uploads/2025/08/STSV2025_ONLINE.pdf", description: "Rules, procedures and student support (PDF)", displayOrder: 6, isActive: true },
  { id: "7", name: "HCMUS", url: "https://hcmus.edu.vn", description: "University website", displayOrder: 7, isActive: false },
];

export function createServiceLinkSeed(): MockServiceLink[] {
  return SERVICE_LINK_SEED.map((link) => ({ ...link, version: 1 }));
}

/**
 * Adds what plan 005 introduced to a store written before it: the hub links and the hub permissions.
 * Users, sessions, tokens and lockouts are kept (approved plan change 1: migrate, never wipe).
 * Returns true when something was added.
 */
export function migrateHub(db: MockDb): boolean {
  let changed = false;
  if (!Array.isArray(db.serviceLinks)) {
    db.serviceLinks = createServiceLinkSeed();
    db.nextServiceLinkId = SERVICE_LINK_SEED.length + 1;
    changed = true;
  }
  for (const permission of HUB_PERMISSIONS) {
    if (!db.permissions.some((p) => p.code === permission.code)) {
      db.permissions.push({ ...permission });
      changed = true;
    }
  }
  const grants: Record<string, string[]> = {
    "role-student": [HUB_READ],
    "role-manager": [HUB_READ],
    "role-administrator": [HUB_READ, HUB_MANAGE],
  };
  for (const [roleId, codes] of Object.entries(grants)) {
    const current = (db.rolePermissions[roleId] ??= []);
    for (const code of codes) {
      if (!current.includes(code)) {
        current.push(code);
        changed = true;
      }
    }
  }
  return changed;
}

function user(partial: Omit<MockUser, "passwordPlain" | "version" | "phoneNumber"> & Partial<MockUser>): MockUser {
  return {
    phoneNumber: null,
    passwordPlain: SEED_PASSWORD,
    version: 1,
    ...partial,
  };
}

export function createSeed(): MockDb {
  return {
    version: 1,
    // Six stored users (data-model §4).
    users: [
      user({
        id: "user-001",
        email: "student1@example.invalid",
        fullName: "Nguyễn Văn An",
        role: "student",
        status: "active",
        studentNumber: "23127001",
        facultyId: "120",
        mustChangePassword: false,
        createdAt: "2026-09-01T08:00:00.000Z",
      }),
      user({
        id: "user-002",
        email: "manager1@example.invalid",
        fullName: "Trần Thị Bích",
        role: "manager",
        status: "active",
        studentNumber: null,
        facultyId: null,
        mustChangePassword: false,
        createdAt: "2026-09-01T08:05:00.000Z",
      }),
      user({
        id: "user-003",
        email: "admin@example.invalid",
        fullName: "Lê Quốc Huy",
        role: "administrator",
        status: "active",
        studentNumber: null,
        facultyId: null,
        mustChangePassword: false,
        createdAt: "2026-09-01T08:10:00.000Z",
      }),
      user({
        id: "user-004",
        email: "disabled@example.invalid",
        fullName: "Phạm Minh Khoa",
        role: "student",
        status: "inactive",
        studentNumber: "23127002",
        facultyId: "120",
        mustChangePassword: false,
        createdAt: "2026-09-02T08:00:00.000Z",
      }),
      user({
        id: "user-005",
        email: "norole@example.invalid",
        fullName: "Võ Thanh Long",
        role: null,
        status: "active",
        studentNumber: null,
        facultyId: null,
        mustChangePassword: false,
        createdAt: "2026-09-02T08:05:00.000Z",
      }),
      user({
        id: "user-006",
        email: "newuser@example.invalid",
        fullName: "Đặng Thu Mai",
        role: "student",
        status: "active",
        studentNumber: "23127003",
        facultyId: "110",
        mustChangePassword: true,
        createdAt: "2026-09-03T08:00:00.000Z",
      }),
    ],
    // Subset of src/server/src/enums/Faculty.ts (ids as strings).
    faculties: [
      { id: "120", code: "CIT", name: "Computer and Information Technology field" },
      { id: "110", code: "MATH", name: "Mathematics field (Mathematics, Applied Mathematics, Computational Mathematics)" },
      { id: "140", code: "CHEM", name: "Chemistry" },
      { id: "150", code: "BIO", name: "Biology" },
      { id: "180", code: "BIOTECH", name: "Biotechnology" },
      { id: "280", code: "DSS", name: "Data Science and Statistics Field" },
    ],
    roles: [
      { id: "role-student", code: "student", name: "Student", description: "Registers for activities and tracks training scores." },
      { id: "role-manager", code: "manager", name: "Manager", description: "Manages assigned activities, registrations and participation." },
      { id: "role-administrator", code: "administrator", name: "Administrator", description: "Manages accounts, roles and system configuration." },
    ],
    permissions: [
      { id: "perm-registration-create", code: "registration.create", description: "Register for activities" },
      { id: "perm-appeal-submit", code: "appeal.submit", description: "Submit recognition requests and appeals" },
      { id: "perm-activity-manage", code: "activity.manage", description: "Create and manage activities" },
      { id: "perm-registration-review", code: "registration.review", description: "Review activity registrations" },
      { id: "perm-attendance-record", code: "attendance.record", description: "Record attendance" },
      { id: "perm-score-submit", code: "score.submit", description: "Submit training-score results" },
      { id: "perm-appeal-review", code: "appeal.review", description: "Review requests and appeals" },
      { id: "perm-score-adjust", code: "score.adjust", description: "Adjust training scores" },
      { id: "perm-criteria-manage", code: "criteria.manage", description: "Configure criteria and categories" },
      { id: "perm-reports-view", code: "reports.view", description: "View system reports" },
      { id: "perm-role-manage", code: "role.manage", description: "Manage user accounts and roles" },
      ...HUB_PERMISSIONS,
    ],
    rolePermissions: {
      "role-student": ["registration.create", "appeal.submit", HUB_READ],
      "role-manager": ["activity.manage", "registration.review", "attendance.record", "score.submit", "appeal.review", HUB_READ],
      "role-administrator": ["role.manage", "criteria.manage", "reports.view", "score.adjust", HUB_READ, HUB_MANAGE],
    },
    issuedTokens: {},
    revokedTokenIds: [],
    loginAttempts: {},
    failures: [],
    nextUserSeq: 7,
    serviceLinks: createServiceLinkSeed(),
    nextServiceLinkId: SERVICE_LINK_SEED.length + 1,
  };
}
