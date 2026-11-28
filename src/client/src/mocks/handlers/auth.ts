import { http } from "msw";
import { OUTAGE_EMAIL } from "@/mocks/db/seed";
import { readDb, updateDb } from "@/mocks/db/store";
import { fail, message, ok } from "@/mocks/utils/envelope";
import { delay, LOGIN_LATENCY_MS } from "@/mocks/utils/latency";
import { apiUrl, permissionsOf, toProfile } from "@/mocks/utils/shape";
import { issueToken } from "@/mocks/utils/token";
import { withAuth, withFailureSwitch } from "@/mocks/handlers/guards";

export const LOCK_THRESHOLD = 5;
export const LOCK_SECONDS = 15 * 60;
const GENERIC_FAILURE = "Email or password is incorrect";

export const authHandlers = [
  /** POST /auth/login — API-GAP-002 / DOC-03 / DOC-04. */
  http.post(
    apiUrl("/auth/login"),
    withFailureSwitch("login", async ({ request }) => {
      await delay(LOGIN_LATENCY_MS);
      let body: { email?: unknown; password?: unknown } = {};
      try {
        body = (await request.json()) as typeof body;
      } catch {
        body = {};
      }
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!email || !password) {
        return fail(400, "VALIDATION_FAILED", "Validation failed", [
          ...(!email ? [{ field: "email", message: "Email is required" }] : []),
          ...(!password ? [{ field: "password", message: "Password is required" }] : []),
        ]);
      }

      // 1. Outage rule (not a stored user), checked before any lookup.
      if (email === OUTAGE_EMAIL) {
        return fail(503, "SERVICE_UNAVAILABLE", "The authentication service is unavailable.");
      }

      const now = Date.now();
      const db = readDb();
      const attempts = db.loginAttempts[email];

      // 2. Lock check (NFR-SEC-05).
      if (attempts?.lockedUntil && now < Date.parse(attempts.lockedUntil)) {
        const retryAfter = Math.ceil((Date.parse(attempts.lockedUntil) - now) / 1000);
        return fail(423, "ACCOUNT_LOCKED", "Account temporarily locked.", undefined, {
          "Retry-After": String(retryAfter),
        });
      }

      const user = db.users.find((u) => u.email.toLowerCase() === email);

      // 3. Unknown email or wrong password: same response; failures counted per email.
      if (!user || user.passwordPlain !== password) {
        const result = updateDb((d) => {
          const current = d.loginAttempts[email] ?? { consecutiveFailures: 0 };
          const lockExpired = current.lockedUntil && now >= Date.parse(current.lockedUntil);
          const failures = (lockExpired ? 0 : current.consecutiveFailures) + 1;
          const locked = failures >= LOCK_THRESHOLD;
          d.loginAttempts[email] = {
            consecutiveFailures: failures,
            ...(locked ? { lockedUntil: new Date(now + LOCK_SECONDS * 1000).toISOString() } : {}),
          };
          return locked;
        });
        if (result) {
          return fail(423, "ACCOUNT_LOCKED", "Account temporarily locked.", undefined, {
            "Retry-After": String(LOCK_SECONDS),
          });
        }
        return fail(401, "INVALID_CREDENTIALS", GENERIC_FAILURE);
      }

      // 4. Disabled account.
      if (user.status === "inactive") {
        return fail(403, "ACCOUNT_DISABLED", "This account is disabled.");
      }

      // 5. Success.
      updateDb((d) => {
        delete d.loginAttempts[email];
      });
      return ok(issueToken(user));
    }),
  ),

  /** GET /auth/me — exempt from account checks (H2); returns role null / status inactive as-is. */
  http.get(
    apiUrl("/auth/me"),
    withFailureSwitch(
      "me",
      withAuth(
        async (_info, { user, db }) => {
          await delay();
          return ok({
            user: toProfile(db, user),
            permissions: permissionsOf(db, user),
            activeOrganizationMemberships: [],
            activeActivityAssignments: [],
          });
        },
        { skipAccountChecks: true },
      ),
    ),
  ),

  /** POST /auth/logout — API-GAP-002; revokes the presented token. */
  http.post(
    apiUrl("/auth/logout"),
    withFailureSwitch(
      "logout",
      withAuth(
        async (_info, { claims }) => {
          await delay();
          updateDb((d) => {
            d.revokedTokenIds.push(claims.jti);
          });
          return message("Signed out");
        },
        { skipStatusAndRoleChecks: true, allowWhenMustChange: true },
      ),
    ),
  ),
];
