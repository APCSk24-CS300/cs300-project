# Coverage: spec 004 acceptance scenarios after the hub rewrite

**Plan**: [plan.md](./plan.md), approved change 2 (risk R2).

**Rule**: no scenario of `src/specs/004-university-service-hub/spec.md` US1–US3 may lose coverage when dev's mock classes and their tests are deleted or rewritten.

This file was written in step 4, **before** any deletion. The *Step* column says when each test reaches its final form. Test titles are kept stable, so later steps can move a test between files without changing this table. Paths are relative to `src/client/`.

**Abbreviations used in the table**
- **hub.test** = `src/mocks/handlers/hub.test.ts`, the MSW hub handlers, which answer like `src/server` HubRoute / HubController.
- **AdminServiceLinks.test** = `src/features/services/admin/components/AdminServiceLinks.test.tsx`. It is renamed in step 6 if the component is renamed.
- **BE** = `src/server/tests/integration/hub.test.ts` (from origin/dev, unchanged: `git diff origin/dev -- src/server` is empty).

## US1: Open a university service from the hub (P1)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | Any role sees only the active links, with name and description, ordered by display order, then name | **hub.test:**<br>• "lists only active links in hub order for every role"<br>**ServiceHub.test:**<br>• "shows a loading skeleton, then every service as a new-tab link" | 4, 6 |
| 2 | Selecting a link opens its URL in a new tab with `noopener noreferrer`; the hub stays open | **ServiceHub.test:**<br>• "shows a loading skeleton, then every service as a new-tab link" (checks `target`, `rel`, and the "opens in a new tab" name)<br>**`src/features/landing/components/ServiceCard.test.tsx`:**<br>• "renders an unlocked service as an external whole-card link" | 6 |
| 3 | No active links: informative empty state (A1) | **hub.test:**<br>• "returns an empty list when no link is active"<br>**ServiceHub.test:**<br>• "shows the empty state when nothing is configured (UC-07 A1)" | 4, 6 |
| 4 | Backend unreachable or erroring: retryable error, and Retry reloads (A4) | **hub.test:**<br>• "answers 500 and a network error through the failure switch"<br>**ServiceHub.test:**<br>• "shows a retryable error (UC-07 A4)" | 4, 6 |
| 5 | External site down: the browser shows the result; myHCMUS adds nothing (A3) | By design: the card is a plain external anchor with no click handler. Same tests as #2, which also assert that no in-app navigation happens. | 6 |
| 6 | Signed-out visitor on `/services` → login, then returned to `/services` | **`src/proxy.test.ts`:**<br>• "sends signed-out visitors from /services and /admin/services to sign-in with a return path"<br>**`src/libs/route-access.test.ts`:**<br>• "/services needs a session but is open to every role, without a role area"<br>**`src/libs/navigation.test.ts`:**<br>• "/services is a safe return path for every role" | 3, 4 |
| 7 | Inactive link: `GET /hub/services/{id}` → 404 | **hub.test:**<br>• "GET /hub/services/{id} answers 404 for inactive, unknown and non-numeric ids"<br>**BE** | 4 |

## US2: Service cards on the landing page (P2)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | Guest: locked, non-interactive preview with "Log in for more", returning to `/#services` | **`src/features/landing/components/ServicesSection.test.tsx`:**<br>• "renders six display-only cards behind the login overlay"<br>• "shows a translucent blurred overlay that leads to login"<br>• "does not load hub data for guests"<br>**`src/features/landing/components/ServiceCard.test.tsx`:**<br>• "renders locked cards without a link or selection"<br>• "renders a preview without href as a picture only" | kept, 6 |
| 2 | Signed in: up to 6 active links from the API as cards, plus "See all services" → `/services` | **`ServicesSection.test.tsx`:**<br>• "shows up to six live links and a link to the hub" | kept, 6 |
| 3 | Signed in, failing API: compact retryable error; the rest of the page renders | **`ServicesSection.test.tsx`:**<br>• "shows a compact retry when the hub fails" | kept, 6 |

## US3: Administrators manage service links (P3)

| # | Scenario | Test(s) after the rewrite | Step |
|---|---|---|---|
| 1 | Admin sees active and inactive links with status, order and URL | **hub.test:**<br>• "GET /admin/services lists inactive links too, and rejects a bad includeInactive"<br>**AdminServiceLinks.test:**<br>• "lists active and inactive links with their status" | 4 |
| 2 | Valid input is saved, listed, and shown in the hub for all roles if active | **hub.test:**<br>• "POST /admin/services creates a link last, with 201, ETag and Location"<br>• "a link the admin adds or deactivates shows in the hub for every role"<br>**AdminServiceLinks.test:**<br>• "adds a link after client-side validation" | 4 |
| 3 | `javascript:alert(1)`, `ftp://x`, or a URL without a scheme: field error and nothing saved; the API independently answers 400 | **`src/features/services/admin/schema/serviceLink.schema.test.ts`:**<br>• "matches the backend URL rules"<br>• "checks required fields, lengths and order"<br>**hub.test:**<br>• "rejects unsafe URLs and bad fields with 400 and per-field codes"<br>• "PATCH needs at least one known field and rejects unknown ones"<br>**AdminServiceLinks.test:**<br>• "adds a link after client-side validation" | 4 |
| 4 | Duplicate name (case-insensitive, trimmed) → "A service with this name already exists" (409), nothing saved | **hub.test:**<br>• "answers 409 DUPLICATE_VALUE for a taken name on create and update"<br>**AdminServiceLinks.test:**<br>• "shows the backend's duplicate-name error on the name field" | 4 |
| 5 | Second admin saves after the first → reload message (412), change not applied | **hub.test:**<br>• "answers 412 for a stale or malformed If-Match and changes nothing"<br>**AdminServiceLinks.test:**<br>• "tells the admin to reload when someone else saved first (412)" (now a real version change in the mock DB, not a stubbed rejection) | 4 |
| 6 | Deactivate after confirmation: gone from the hub, still listed as Inactive, can be reactivated | **hub.test:**<br>• "DELETE deactivates without deleting; a second DELETE is a no-op; PATCH isActive reactivates"<br>• "a link the admin adds or deactivates shows in the hub for every role"<br>**AdminServiceLinks.test:**<br>• "asks before deactivating, then allows reactivating"<br>• "cancelling the confirmation changes nothing" | 4, 6 (dialog) |
| 7 | Student or manager: every `/admin/services` endpoint → 403, and the page shows forbidden | **hub.test:**<br>• "answers 403 to students and managers on every admin endpoint and 401 without a token"<br>**`src/proxy.test.ts`:**<br>• "sends non-administrators on /admin/services to /forbidden and lets administrators in"<br>**AdminServiceLinks.test:**<br>• "shows the forbidden view when the API answers 403" | 3, 4, 5 |
| 8 | Every successful change writes exactly one `AuditLog` row, in the same transaction | **BE only.** The audit trail is server-side and the FE cannot observe it, so the mock keeps no audit log. Coverage is unchanged by this feature. | — |

## Edge cases from spec 004 that dev's tests covered

| Edge case | Test after the rewrite | Step |
|---|---|---|
| Ties: order, then lower-case name, then id | `src/features/services/mappers/service.mapper.test.ts`: "sorts by display order, then name, then id"<br>**hub.test:** "lists only active links in hub order for every role" | kept, 4 |
| No order on create → last (max + 1) | **hub.test:** "POST /admin/services creates a link last, with 201, ETag and Location" | 4 |
| Trimming; an empty description is stored as null | `serviceLink.schema.test.ts`: "trims and builds the API body; empty order and description are left to the backend"<br>**hub.test:** "POST /admin/services creates a link last, with 201, ETag and Location" | kept, 4 |
| Credentials, whitespace, more than 2048 characters | **hub.test:** "rejects unsafe URLs and bad fields with 400 and per-field codes"<br>`serviceLink.schema.test.ts` | 4 |
| An unsafe or malformed record never renders a link | `service.mapper.test.ts`: "drops unsafe or malformed items", "isSafeHref accepts http(s) only" | kept |
| Icons by name slug with a fallback | `service.mapper.test.ts`: "picks icons by name slug with a fallback" | kept |
| `PATCH` that changes nothing → 200 with the current link | **hub.test:** "PATCH that changes nothing returns the current link and version" | 4 |
| Loading is cancelled on unmount; stale answers are ignored | `src/features/services/hooks/useHubServices.test.tsx`: "goes from loading to success", "reports empty when there are no services", "reports errors and recovers on refetch", "does not load when disabled", "ignores the answer after unmount" | 5 |
| An old mock DB without service links is migrated, keeping users and sessions | `src/mocks/db/store.test.ts`: "adds the hub links to an older store and keeps users and sessions" | 4 |

## Dev tests deleted or rewritten, and their replacements

| Dev test (origin/dev) | What happens to it | Replacement |
|---|---|---|
| `features/services/admin/services/mock.admin-hub.service.test.ts` • "hub shows active links only; admin changes show in the hub" | Deleted in step 4, along with `MockHubService` and `MockAdminHubService` | **hub.test:** "lists only active links in hub order for every role", "a link the admin adds or deactivates shows in the hub for every role", "POST /admin/services creates a link last, with 201, ETag and Location" |
| same file • "enforces unique names and versions" | Deleted in step 4 | **hub.test:** "answers 409 DUPLICATE_VALUE for a taken name on create and update", "answers 412 for a stale or malformed If-Match and changes nothing", "GET /hub/services/{id} answers 404 for inactive, unknown and non-numeric ids" (PATCH 404 case) |
| `features/services/admin/components/AdminServiceLinks.test.tsx` (8 tests) | Rewritten in step 4: MSW instead of `MockAdminHubService` and `mockServiceLinkStore`, same titles. "shows a retryable error when the list cannot load" uses the failure switch. Selectors change in step 6 (DataTable, dialog). | Same titles in the same file (renamed in step 6 if the component is renamed) |
| `features/services/hooks/useUniversityServices.test.tsx` (5 tests) | Rewritten in step 5, when the hook moves onto `useAsyncResource` | `useHubServices.test.tsx`, with the titles listed above |
| `features/services/components/ServiceHub.test.tsx`, landing `ServicesSection.test.tsx`, landing `ServiceCard.test.tsx` | Kept. They inject a fake `HubService` (an interface, not a mock class). Steps 5–6 adapt them to the new hook and UI. | Same titles |
