import { HttpResponse, http } from "msw";
import { PASSWORD_MIN_LENGTH, PASSWORD_TOO_SHORT, codePointLength } from "@/libs/validation/password";
import { PHONE_PATTERN } from "@/libs/validation/phone";
import { deleteAvatarFile, getAvatarFile, putAvatarFile, type MockAvatarFile } from "@/mocks/db/avatar-files";
import { readDb, updateDb } from "@/mocks/db/store";
import type { MockDb, MockUser } from "@/mocks/db/types";
import { fail, message } from "@/mocks/utils/envelope";
import { delay } from "@/mocks/utils/latency";
import { hubFail as serviceFail, hubOk as serviceOk } from "@/mocks/utils/service-response";
import { apiUrl } from "@/mocks/utils/shape";
import { withAuth, withFailureSwitch } from "@/mocks/handlers/guards";

/** Re-exported for existing tests; the rule itself lives in libs/validation/password.ts (DOC-23). */
export { PASSWORD_MIN_LENGTH };

/**
 * UC-03 profile operations, answering like src/server (ProfileRoute / ProfileService, AvatarRoute /
 * AvatarService, PasswordController). Token and account checks reuse `withAuth` (005 rule).
 * Envelopes, as the BE sends them (docs-changes DOC-16, DOC-20):
 * - GET/PATCH /profile: ServiceResponse `{ success, statusCode, payload: { message, data } }`;
 *   errors carry one `{ field }` object (400/409) in `payload.data.details`;
 * - avatar upload: `{ success, data: { avatarUrl } }`; removal / password: `{ success, message }`;
 *   avatar errors: `{ success: false, [code], message }`.
 */

/** 10 MiB inclusive, as `MAX_AVATAR_BYTES` in src/server/src/helper/validateAvatar.ts. */
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

const AVATAR_PATH = "/api/v1/profile/avatar/files/";
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Stand-in for Sharp: decide the type by content (signature), never by file name or declared MIME. */
export function sniffAvatar(bytes: Uint8Array): MockAvatarFile["mime"] | null {
  if (PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

/** The BE `Profile` (src/server/src/types/Profile.ts): no role, status or gap fields. */
export function toOwnProfile(db: MockDb, user: MockUser) {
  const faculty = db.faculties.find((f) => f.id === user.facultyId);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl ?? null,
    academicInfo:
      user.role === "student"
        ? {
            studentNumber: user.studentNumber,
            faculty: faculty ? { id: faculty.id, code: faculty.code, name: faculty.name } : null,
            major: null,
            enrollmentYear: null,
          }
        : null,
  };
}

/** `0…` and `+84…` are the same number for the duplicate check (ProfileService.equivalentPhoneNumber). */
function equivalentPhoneNumber(phone: string): string {
  return phone.startsWith("+84") ? `0${phone.slice(3)}` : `+84${phone.slice(1)}`;
}

function fileNameOf(url: string | null): string | null {
  return url && url.startsWith(AVATAR_PATH) ? url.slice(AVATAR_PATH.length) : null;
}

const conflict = (op: "uploadAvatar" | "removeAvatar") => readDb().failures.includes(`${op}:conflict`);

export const profileHandlers = [
  /** GET /profile — the caller's own profile (FR-002: the user comes from the token). */
  http.get(
    apiUrl("/profile"),
    withFailureSwitch(
      "getProfile",
      withAuth(async (_info, { user, db }) => {
        await delay();
        return serviceOk(toOwnProfile(db, user));
      }),
    ),
  ),

  /** PATCH /profile — phoneNumber only (string matching the pattern, or null to clear). */
  http.patch(
    apiUrl("/profile"),
    withFailureSwitch(
      "updateProfile",
      withAuth(async ({ request }, { user }) => {
        await delay();
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          body = undefined;
        }
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
          return serviceFail(400, "A profile update object is required");
        }
        const record = body as Record<string, unknown>;
        const unsupported = Object.keys(record).filter((field) => field !== "phoneNumber");
        if (unsupported.length > 0) {
          return serviceFail(400, "Only phoneNumber may be updated", { fields: unsupported });
        }
        if (!Object.prototype.hasOwnProperty.call(record, "phoneNumber")) {
          return serviceFail(400, "phoneNumber is required");
        }
        const phone = record.phoneNumber;
        if (phone !== null && (typeof phone !== "string" || !PHONE_PATTERN.test(phone))) {
          return serviceFail(400, "Phone number must be 10 digits starting with 0 or +84 followed by 9 digits", {
            field: "phoneNumber",
          });
        }
        const outcome = updateDb((db) => {
          if (phone !== null) {
            const taken = [phone, equivalentPhoneNumber(phone)].some((candidate) =>
              db.users.some((u) => u.id !== user.id && u.phoneNumber === candidate),
            );
            if (taken) return "duplicate" as const;
          }
          const target = db.users.find((u) => u.id === user.id)!;
          target.phoneNumber = phone;
          target.version += 1;
          return toOwnProfile(db, target);
        });
        if (outcome === "duplicate") {
          return serviceFail(409, "Phone number is already in use", { field: "phoneNumber" });
        }
        return serviceOk(outcome);
      }),
    ),
  ),

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

  /** POST /profile/avatar — multipart, exactly one file field `avatar`; JPG/PNG by content; ≤ 10 MiB. */
  http.post(
    apiUrl("/profile/avatar"),
    withFailureSwitch(
      "uploadAvatar",
      withAuth(async ({ request }, { user }) => {
        await delay();
        const unsupported = () =>
          HttpResponse.json(
            { success: false, code: "UNSUPPORTED_FILE", message: "Choose a valid JPG or PNG image up to 10 MB." },
            { status: 400 },
          );
        if (!(request.headers.get("content-type") ?? "").startsWith("multipart/form-data;")) return unsupported();
        let entries: [string, FormDataEntryValue][];
        try {
          entries = [...(await request.formData()).entries()];
        } catch {
          return unsupported();
        }
        if (entries.length !== 1 || entries[0]![0] !== "avatar" || typeof entries[0]![1] === "string") {
          return unsupported();
        }
        const bytes = new Uint8Array(await (entries[0]![1] as File).arrayBuffer());
        const mime = bytes.length > 0 && bytes.length <= MAX_AVATAR_BYTES ? sniffAvatar(bytes) : null;
        if (!mime) return unsupported();
        if (conflict("uploadAvatar")) {
          return HttpResponse.json({ success: false, message: "Picture changed while uploading. Please retry." }, { status: 409 });
        }
        const name = `${crypto.randomUUID()}.${mime === "image/png" ? "png" : "jpg"}`;
        putAvatarFile(name, { bytes, mime });
        const avatarUrl = `${AVATAR_PATH}${name}`;
        const previous = updateDb((db) => {
          const target = db.users.find((u) => u.id === user.id)!;
          const old = target.avatarUrl;
          target.avatarUrl = avatarUrl;
          target.version += 1;
          return old;
        });
        const oldName = fileNameOf(previous);
        if (oldName) deleteAvatarFile(oldName);
        return HttpResponse.json({ success: true, data: { avatarUrl } });
      }),
    ),
  ),

  /** DELETE /profile/avatar — no body; clears the URL and the file; restores the default picture. */
  http.delete(
    apiUrl("/profile/avatar"),
    withFailureSwitch(
      "removeAvatar",
      withAuth(async ({ request }, { user }) => {
        await delay();
        if ((await request.text()).length > 0) {
          return HttpResponse.json({ success: false, message: "No request body is accepted" }, { status: 400 });
        }
        if (conflict("removeAvatar")) {
          return HttpResponse.json({ success: false, message: "Picture changed while removing. Please retry." }, { status: 409 });
        }
        const previous = updateDb((db) => {
          const target = db.users.find((u) => u.id === user.id)!;
          const old = target.avatarUrl;
          target.avatarUrl = null;
          target.version += 1;
          return old;
        });
        const oldName = fileNameOf(previous);
        if (oldName) deleteAvatarFile(oldName);
        return HttpResponse.json({ success: true, message: "Avatar removed successfully" });
      }),
    ),
  ),

  /** GET /profile/avatar/files/{fileName} — only the caller's current picture; bytes, no-store. */
  http.get(
    apiUrl("/profile/avatar/files/:fileName"),
    withAuth(async ({ params }, { user }) => {
      await delay();
      const name = String(params.fileName);
      const file = fileNameOf(user.avatarUrl) === name ? getAvatarFile(name) : undefined;
      if (!file) {
        return HttpResponse.json({ success: false, message: "Picture not found" }, { status: 404 });
      }
      return new HttpResponse(file.bytes, {
        status: 200,
        headers: { "Content-Type": file.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
      });
    }),
  ),
];
