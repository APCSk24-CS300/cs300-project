import { http } from "msw";
import { isRoleCode } from "@/libs/roles";
import { updateDb } from "@/mocks/db/store";
import type { MockUser } from "@/mocks/db/types";
import { fail, ok } from "@/mocks/utils/envelope";
import { delay } from "@/mocks/utils/latency";
import { apiUrl, toAdminUser } from "@/mocks/utils/shape";
import { withAuth, withFailureSwitch } from "@/mocks/handlers/guards";
import { PHONE_INVALID, isValidPhoneNumber } from "@/libs/validation/phone";

const SORTABLE = new Set(["createdAt", "fullName", "email"]);

type FieldError = { field: string; code?: string; message: string };

export const adminUserHandlers = [
  /** GET /admin/users — UserListResponse (contract). */
  http.get(
    apiUrl("/admin/users"),
    withFailureSwitch(
      "listUsers",
      withAuth(
        async ({ request }, { db }) => {
          await delay();
          const params = new URL(request.url).searchParams;
          const search = (params.get("search") ?? "").trim().toLowerCase();
          const role = params.get("role");
          const status = params.get("status");
          const page = Math.max(1, Number(params.get("page")) || 1);
          const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 10));
          const sortBy = SORTABLE.has(params.get("sortBy") ?? "") ? (params.get("sortBy") as keyof MockUser) : "createdAt";
          const sortOrder = params.get("sortOrder") === "asc" ? 1 : -1;

          let items = db.users.filter((u) => {
            if (role && u.role !== role) return false;
            if (status && u.status !== status) return false;
            if (!search) return true;
            return [u.fullName, u.email, u.studentNumber ?? ""].some((v) => v.toLowerCase().includes(search));
          });
          items = [...items].sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])) * sortOrder);
          const totalItems = items.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / limit));
          const slice = items.slice((page - 1) * limit, page * limit);
          return ok({
            items: slice.map((u) => toAdminUser(db, u, false)),
            pagination: { page, limit, totalItems, totalPages },
          });
        },
        { requireRole: "administrator" },
      ),
    ),
  ),

  /** POST /admin/users — CreateUserRequest + initialPassword (GAP-C); validation order per mock-api.md. */
  http.post(
    apiUrl("/admin/users"),
    withFailureSwitch(
      "createUser",
      withAuth(
        async ({ request }, { db }) => {
          await delay();
          let body: Record<string, unknown> = {};
          try {
            body = (await request.json()) as Record<string, unknown>;
          } catch {
            body = {};
          }

          // A11: exactly one role.
          if (!isRoleCode(body.role)) {
            return fail(400, "VALIDATION_FAILED", "Validation failed", [
              { field: "role", code: "SINGLE_ROLE_REQUIRED", message: "Each account has exactly one role" },
            ]);
          }
          const role = body.role;
          const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
          const email = str("email").toLowerCase();
          const fullName = str("fullName");
          const studentNumber = str("studentNumber");
          const facultyId = str("facultyId");
          const phoneNumber = str("phoneNumber");
          const initialPassword = typeof body.initialPassword === "string" ? body.initialPassword : "";

          const errors: FieldError[] = [];
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ field: "email", message: "Enter a valid email address" });
          if (!fullName) errors.push({ field: "fullName", message: "Full name is required" });
          if (initialPassword.length < 8) errors.push({ field: "initialPassword", message: "Use at least 8 characters" });
          // Mock-only for now: CreateUserRequest has no phone pattern in the contract yet (DOC-07, plan 006 Q4).
          if (!isValidPhoneNumber(phoneNumber)) errors.push({ field: "phoneNumber", message: PHONE_INVALID });
          if (role === "student") {
            if (!studentNumber) errors.push({ field: "studentNumber", message: "Student number is required" });
            if (!facultyId || !db.faculties.some((f) => f.id === facultyId)) {
              errors.push({ field: "facultyId", message: "Choose a faculty" });
            }
          }
          if (errors.length > 0) {
            return fail(400, "VALIDATION_FAILED", "Validation failed", errors);
          }

          // A6: example policy — student fields only for the student role (GAP-H / DOC-08).
          if (role !== "student" && (studentNumber || facultyId)) {
            return fail(400, "ROLE_POLICY_VIOLATION", "Student number and faculty are allowed only for role student.");
          }

          // Duplicates.
          if (db.users.some((u) => u.email.toLowerCase() === email)) {
            return fail(409, "DUPLICATE_VALUE", "Email already exists", [
              { field: "email", code: "DUPLICATE_VALUE", message: "This email is already in use" },
            ]);
          }
          if (studentNumber && db.users.some((u) => u.studentNumber === studentNumber)) {
            return fail(409, "DUPLICATE_VALUE", "Student number already exists", [
              { field: "studentNumber", code: "DUPLICATE_VALUE", message: "This student number is already in use" },
            ]);
          }

          const created = updateDb((d) => {
            const user: MockUser = {
              id: `user-${String(d.nextUserSeq).padStart(3, "0")}`,
              email,
              fullName,
              phoneNumber: phoneNumber || null,
              role,
              status: "active",
              studentNumber: role === "student" ? studentNumber : null,
              facultyId: role === "student" ? facultyId : null,
              passwordPlain: initialPassword,
              mustChangePassword: true,
              version: 1,
              createdAt: new Date().toISOString(),
            };
            d.nextUserSeq += 1;
            d.users.push(user);
            return { user, db: d };
          });
          return ok(toAdminUser(created.db, created.user, true), 201, { ETag: '"1"' });
        },
        { requireRole: "administrator" },
      ),
    ),
  ),
];
