import { http } from "msw";
import { fail, ok } from "@/mocks/utils/envelope";
import { delay } from "@/mocks/utils/latency";
import { apiUrl } from "@/mocks/utils/shape";
import { withAuth, withFailureSwitch } from "@/mocks/handlers/guards";

export const referenceHandlers = [
  http.get(
    apiUrl("/admin/faculties"),
    withFailureSwitch(
      "listFaculties",
      withAuth(
        async (_info, { db }) => {
          await delay();
          return ok(db.faculties);
        },
        { requireRole: "administrator" },
      ),
    ),
  ),
  http.get(
    apiUrl("/admin/roles"),
    withFailureSwitch(
      "listRoles",
      withAuth(
        async (_info, { db }) => {
          await delay();
          return ok(db.roles);
        },
        { requireRole: "administrator" },
      ),
    ),
  ),
  http.get(
    apiUrl("/admin/roles/:roleId/permissions"),
    withFailureSwitch(
      "listRoles",
      withAuth(
        async ({ params }, { db }) => {
          await delay();
          const role = db.roles.find((r) => r.id === params.roleId);
          if (!role) {
            return fail(404, "NOT_FOUND", "Role not found");
          }
          const codes = db.rolePermissions[role.id] ?? [];
          return ok({
            role,
            permissions: db.permissions.filter((p) => codes.includes(p.code)),
            version: 1,
          });
        },
        { requireRole: "administrator" },
      ),
    ),
  ),
];
