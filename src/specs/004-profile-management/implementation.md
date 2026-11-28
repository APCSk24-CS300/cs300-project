# Profile implementation and schema reference

Approved by the requester on 2026-11-28: retain Next.js, accept domestic `0` plus nine digits or `+84` plus nine digits, allow clearing phone numbers, map student number from `Student.user_id` for student accounts, store avatar files separately while storing only a legal URL in PostgreSQL, and use Sharp for full image decoding. The requester's additional constraint is to check against schema design as the source of truth.

## Schema cross-check

The executable reference is [`db/schema.sql`](../../db/schema.sql), especially `User`, `Student`, `UserRole`, `Role`, `RolePermission`, and `Permission`. The associated design reference is `docs/analysis-and-design/db/business-requirements.md` in the repository root.

| Concern | Executable schema and implementation |
| --- | --- |
| Account identity | `User.user_id TEXT`; never coerce to a number; use it as student number only when a Student row exists. |
| Editable values | `User.phone_number`, `User.password_hash`, `User.avatar_url` only, through distinct validated operations. |
| Protected identity | `User.full_name` and `User.email` are displayed without owner editing. Faculty comes from `Student.faculty_id` joined to `Faculty`. |
| Student number | The design document describes `User.student_number`, but the current SQL has no such column. Use Student.user_id as the read-only student number for student rows; return null for accounts without a Student row. No migration is needed. |
| Faculty difference | The design document also describes `User.faculty_id`; SQL currently stores faculty on `Student`. Use that existing relationship. |
| Independent roles | Read `UserRole` joined to `Role`; preserve `student`, `manager`, `administrator`. Only map `administrator` to the existing UI label `admin`. No inherited permissions. |
| Inactive accounts | Follow the SQL `is_active` field; inactive accounts cannot use these profile operations. |

No schema change or migration is required. Existing phone values are not rewritten. Equivalent domestic/international duplicate checks retain the existing application behavior; the schema does not define a unique phone index.

## Storage and API

Profile reads/phone updates retain the existing `success` plus `payload.data` response envelope; the client also accepts the documented `success/data` envelope. Avatar responses use `success/data` and password/removal responses use a message-only success body.

The authenticated backend remains `GET/PATCH /api/v1/profile` and `PATCH /api/v1/profile/password`. Only `phoneNumber` is accepted by the profile PATCH. Use null to clear it. Password requests include `currentPassword` and `newPassword`; confirmation is frontend-only. The server verifies the current bcrypt hash and atomically replaces it only if the verifier has not changed concurrently.

`POST /api/v1/profile/avatar` accepts multipart form data with exactly one file field named `avatar`. Sharp decodes the full image independently of filename and declared MIME; only decoded JPG/PNG content is accepted. The maximum file size is 10 MiB (10 × 1024 × 1024 bytes), inclusive. Unsupported, malformed, empty, or oversized files receive 400 with `UNSUPPORTED_FILE`.

Validated image bytes are written to the configured `AVATAR_STORAGE_DIRECTORY` (default `server/data/avatars` when the server starts from its project directory). The existing `User.avatar_url TEXT` stores only a legal same-origin URL such as `/api/v1/profile/avatar/files/{uuid}.png`; the same-origin Next.js bridge forwards authenticated image reads to the backend. The file endpoint returns only the authenticated user's currently referenced image. Deployed environments must mount persistent storage at this directory.

Upload writes a new uniquely named image file, then updates the URL in PostgreSQL using a compare-and-set against the previous URL. If the database update fails, the newly written file is removed and the old URL/file remain intact. If another avatar update wins first, the losing request gets 409 and its new file is removed. After a successful replacement, the old file is removed. `DELETE /api/v1/profile/avatar` accepts no body, clears the URL, removes the old file, and returns a success message; null restores the default initials picture. Storage failures return 500 with a retryable generic message.

## Authentication and configuration

The production auth provider uses the real service. The Next.js login route calls existing backend `POST /api/auth/login`, then verifies the selected duty against database-backed `GET /api/auth/me`. Backend identity has string IDs; profile reads expose `Student.user_id` as the displayed student number only when a Student row exists. Client-selected roles cannot create a duty.

Next.js stores the backend access token and signed UI session in separate HTTP-only, SameSite=Lax cookies; production cookies use Secure. Tokens/passwords are not returned to browser code. Same-origin profile route handlers forward only the cookie's backend token, preserve request methods and multipart boundaries, bound upload buffering, disable response caching, and clear expired credentials. Cross-origin writes are denied. Mock auth remains test/demo code and is not used by the production provider.

Configure `API_BACKEND_URL` on the Next.js server (default `http://localhost:8080`) and a strong `SESSION_SECRET`. Configure backend `JWT_SECRET`, the existing PostgreSQL variables, and `AVATAR_STORAGE_DIRECTORY`; mount that directory on persistent storage for deployments. The same-origin profile/auth bridge does not use `NEXT_PUBLIC_API_BASE_URL`; other existing client APIs retain their current setting. Start PostgreSQL, Express, and Next.js, sign in with an actual provisioned account, and open `/profile`.

## Verification

Unit tests cover validation, HTTP methods/bodies, protected identity, JWT rejection, password clearing, avatar preview/rejection/removal, image-load recovery, service responses, and HTTP-only cookie forwarding/expiry. The schema integration test is `server/tests/integration/profilePersistence.test.ts`. It runs only when `PROFILE_TEST_DATABASE_URL` names a disposable database loaded from `db/schema.sql`; it never loads environment secrets or uses a production connection by default.

Run `npm test` in each client/server project and `tsc --noEmit` in each. For database coverage, run the server suite with `PROFILE_TEST_DATABASE_URL` set to that disposable database. The integration test exercises actual login, the real client API transport through a browser-origin adapter, JWT middleware, services/repositories, and PostgreSQL; it covers all three account duties, rereads, protected/cross-user writes, concurrent updates, password replacement, JPEG/PNG upload, the exact size boundary, rejection preservation, removal, and a trigger-simulated write failure. Next.js cookie/session boundaries also have focused unit coverage. This is automated integration/unit verification, not a claim of a full browser end-to-end run.

## UC-03 decision update (2026-11-28)

The requester clarified `Student.user_id` as the student number, matching the schema foreign key to `User.user_id`. The requester also directed the password rule to align with UC-03 A7 and `docs/analysis-and-design/business-rules.md` BR-ACC-09: six Unicode characters. The backend and client both count Unicode code points. Earlier eight-character and unavailable-number notes in completed task history describe the previous baseline and are superseded by T036–T047.
