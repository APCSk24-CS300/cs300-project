# Quickstart: Profile Management in the 003 + 005 frontend (plan 006)

How to check the integrated profile in both modes.

**Phase scope (approved).** Mock mode fully, and real mode for the profile and hub **operations** with a minted token. End-to-end sign-in against the BE is the next phase (`HANDOFF.md`, "Next phase: E2E authentication").

**References:**
- [coverage.md](./coverage.md): which test covers which UC-03 scenario;
- [plan.md](./plan.md): the approved decisions, including that the password minimum stays 8;
- `../003-auth-dashboard-admin-users/docs-changes.md`: DOC-19 to DOC-23;
- the 005 quickstart, for the hub.

## 1. Automated gates (from `src/client`)

```bash
npx tsc --noEmit -p .        # if a running `npm run dev` left .next/dev half-written, restart it first
npx vitest run               # MSW profile handlers: src/mocks/handlers/profile.test.ts
npm run lint
npm run build
cd ../.. && git diff --quiet origin/dev -- src/server src/db && echo "server/db identical to origin/dev"
```

## 2. Mock mode (default)

**`.env.local`:** `NEXT_PUBLIC_API_MODE=mock` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`.

Run `npm run dev` and open **http://localhost:3000**. Use localhost, not a LAN IP: the MSW worker needs a secure context.

**Mock store behaviour:**
- It migrates in place (`avatarUrl` is added to older stores, and users and sessions are kept).
- `__myhcmusMock.reset()` restores the seed.
- Avatar **bytes are kept in memory** (approved Q7). After a page reload the saved picture's file is gone: the page shows the initials and "Retry picture" (the UC-03 A9 path), while the saved URL is still on the profile.

**Seed accounts** (password `demo2026`): `student1@example.invalid` (student), `manager1@example.invalid` (manager), `admin@example.invalid` (administrator).

**Walkthrough** (check at 360 px and at desktop width):

1. **Navigation.** The side nav's "Profile" and the account menu's "My profile" (the first menu item) open `/profile` for every role. Signed out, `/profile` goes to `/login?redirectTo=%2Fprofile`.
2. **Read only (A6).** For the student: name, email, role, student number `23127001` and the faculty, all as text. For the manager and the administrator: "No academic information available". There are no inputs in "Account details".
3. **Phone (steps 3–4, A1, A5):**
   - Edit → `12345` → Save: a field error, the draft is kept, nothing is saved.
   - Edit → `+84901234567` → Save: "Phone number updated successfully."
   - Edit → change → Cancel: discarded.
   - Leave it empty → Save: the number is removed ("Not provided").
4. **Duplicate phone (409).** As the manager, save `0911111111`. Then, as the student, save `+84911111111`. The field error "This phone number is already used by another account." appears.
5. **Picture (A3 / A4 / A8 / A9):**
   - Choose a PNG/JPG → preview → "Save picture": the picture shows on the page **and in the account menu** (through `auth.refresh()`).
   - Choose a `.gif`: "Choose a JPG or PNG image." and nothing is sent.
   - Rename a text file to `.png`: the server rejects it ("Choose a JPG or PNG image up to 10 MB. Your saved picture is unchanged.").
   - "Remove picture" → confirm dialog → "Confirm removal": the initials come back in both places.
6. **Password (A2 / A7):**
   - A wrong current password shows "Current password is incorrect" on the field, and the new password is kept.
   - 7 characters: "Use at least 8 characters" (DOC-23).
   - A correct change: "Password changed successfully.", you stay on the page, and the new password works at the next sign-in.
7. **Failures, from the console:**
   - `__myhcmusMock.fail("getProfile")` → reload: "Profile could not be loaded" + Retry. Then `clearFailures()` and click Retry.
   - `fail("updateProfile")`: the phone save shows an alert and the draft is kept.
   - `fail("uploadAvatar")`, `fail("uploadAvatar:conflict")` (409) and `fail("removeAvatar")`: the saved picture is unchanged and you can retry.
8. **003 first sign-in, unchanged.** `newuser@example.invalid` → "Set a new password" → dashboard.

## 3. Real mode: profile and hub operations with a minted token (Q2)

The real-mode UI cannot sign in yet (DOC-19, GAP-E), so check the transport path with curl through the same-origin forwarder.

**Database and backend:**
- Apply `src/db/schema.sql`, then `seed.sql`, then `hub_schema.sql` (see `src/db/README.md` and the 004 hub quickstart).
- The profile BE needs `JWT_SECRET` and `AVATAR_STORAGE_DIRECTORY` (`src/server/.env.example`).
- Start it with `cd src/server && npm start` (:8080).

**Mint tokens** for seeded DB users:

```bash
cd src/server
S=$(node scripts/mint-dev-token.ts SEED-STUDENT-1)
A=$(node scripts/mint-dev-token.ts SEED-ADMIN)
```

**`src/client/.env.local`** (restart `npm run dev` after changing it):

```
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_BASE_URL=/api/backend
BACKEND_API_URL=http://localhost:8080/api/v1
ALLOW_DEV_BACKEND_TOKEN=false
```

**Through the forwarder:**

```bash
B=localhost:3000/api/backend
curl -s $B/profile -H "Authorization: Bearer $S"                                     # 200, ServiceResponse, own profile
curl -s -X PATCH $B/profile -H "Authorization: Bearer $S" -H "Content-Type: application/json" \
     -d '{"phoneNumber":"12345"}'                                                    # 400, payload.data.details = { field: phoneNumber }
curl -s -X PATCH $B/profile -H "Authorization: Bearer $S" -H "Content-Type: application/json" \
     -d '{"fullName":"X"}'                                                           # 400 "Only phoneNumber may be updated"
curl -s -X PATCH $B/profile/password -H "Authorization: Bearer $S" -H "Content-Type: application/json" \
     -d '{"currentPassword":"wrong","newPassword":"abcdefgh"}'                       # 400 CURRENT_PASSWORD_INCORRECT
curl -s -F avatar=@pic.png $B/profile/avatar -H "Authorization: Bearer $S"           # 200 { data: { avatarUrl } }; multipart passes the forwarder byte-exact
curl -s -o out.png -w '%{http_code} %{content_type}\n' \
     "$B/profile/avatar/files/<name from avatarUrl>" -H "Authorization: Bearer $S"   # 200 image/png; cmp out.png pic.png
curl -s -F avatar=@notes.txt $B/profile/avatar -H "Authorization: Bearer $S"         # 400 UNSUPPORTED_FILE
head -c 10551297 /dev/zero > big.bin && curl -s -o /dev/null -w '%{http_code}\n' \
     -F avatar=@big.bin $B/profile/avatar -H "Authorization: Bearer $S"              # 413 from the forwarder (> 10 MiB + 64 KiB), BE not called
curl -s -X DELETE $B/profile/avatar -H "Authorization: Bearer $S"                    # 200 "Avatar removed successfully"
curl -s -o /dev/null -w '%{http_code}\n' "$B/profile/avatar/files/..%2Fx"            # 404 (allowlist)
curl -s $B/hub/services -H "Authorization: Bearer $S"                                # hub, as in the 005 quickstart
```

**Config-only switch:** build in real mode, then run `git status`. There must be no changes under `src/app`, `src/components` or `src/features`.

### Differences from `src/specs/004-profile-management/implementation.md`

| implementation.md | Here (plan 006) | DOC |
|---|---|---|
| A Next.js cookie BFF (`app/api/auth/*`, `app/api/v1/profile/*`, `SESSION_SECRET`, `API_BACKEND_URL`) | None of it. The 003 / 005 bearer goes through `/api/backend` (approved Q1). | DOC-19 |
| The avatar `<img src>` with a cookie | `ProfileAvatar` fetches the file with the bearer (`api.blob`) and shows an object URL (Q5) | DOC-21 |
| Password minimum 6 | **8 in the FE** (Q3). The BE accepts 6, so FE-valid passwords are always BE-valid. | DOC-23 |
| A role chosen at login, `administrator → admin` | One role per account; the contract code `administrator` | DOC-19 |
