import { http } from "msw";
import { updateDb } from "@/mocks/db/store";
import { fail, message } from "@/mocks/utils/envelope";
import { delay } from "@/mocks/utils/latency";
import { apiUrl } from "@/mocks/utils/shape";
import { withAuth, withFailureSwitch } from "@/mocks/handlers/guards";
import { PASSWORD_MIN_LENGTH, PASSWORD_TOO_SHORT, codePointLength } from "@/libs/validation/password";

/** Re-exported for existing tests; the rule itself lives in libs/validation/password.ts (DOC-23). */
export { PASSWORD_MIN_LENGTH };

export const profileHandlers = [
  /** PATCH /profile/password — contract ChangePasswordRequest; clears mustChangePassword (GAP-M). */
  http.patch(
    apiUrl("/profile/password"),
    withFailureSwitch(
      "changePassword",
      withAuth(
        async ({ request }, { user }) => {
          await delay();
          let body: { currentPassword?: unknown; newPassword?: unknown } = {};
          try {
            body = (await request.json()) as typeof body;
          } catch {
            body = {};
          }
          const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
          const next = typeof body.newPassword === "string" ? body.newPassword : "";

          if (current !== user.passwordPlain) {
            return fail(400, "CURRENT_PASSWORD_INCORRECT", "Current password is incorrect.", [
              { field: "currentPassword", code: "CURRENT_PASSWORD_INCORRECT", message: "Current password is incorrect" },
            ]);
          }
          if (codePointLength(next) < PASSWORD_MIN_LENGTH) {
            return fail(400, "VALIDATION_FAILED", "Validation failed", [
              { field: "newPassword", code: "TOO_SHORT", message: PASSWORD_TOO_SHORT },
            ]);
          }
          updateDb((db) => {
            const target = db.users.find((u) => u.id === user.id);
            if (target) {
              target.passwordPlain = next;
              target.mustChangePassword = false;
              target.version += 1;
            }
          });
          return message("Password updated");
        },
        { allowWhenMustChange: true },
      ),
    ),
  ),
];
