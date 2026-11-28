# Feature Specification: University Services Hub

**Feature Branch**: `feat/university-service-hub` (Spec Kit number 004)

**Created**: 2026-11-27

**Status**: Implemented (approved 2026-11-27)

**Input**: User description: "Implement functional group: University Service Hub. Deliverable: end-to-end functional group."

## Sources

This feature is already described in the project documents. This spec turns them into testable requirements and does not add new business scope.

| Source | What it says |
| --- | --- |
| `docs/requirements/vision-document.md` Feature 11, §4.1, Dependency 5 | Users reach frequently used university services (Moodle, Student Portal, library) from one dashboard. myHCMUS links to them and does not replace or integrate with them. |
| `docs/requirements/use-case-specifications.md` UC-07 | Authenticated user opens the hub, sees links, opens one in the browser. A1 empty state, A2 close without action, A3 broken external link is not our responsibility, A4 retryable load error. |
| `docs/requirements/use-case-model.md` §3.1, §4 | UC-07 belongs to every role (generalized User). Functional group 11 = UC-07 only. |
| `docs/analysis-and-design/business-rules.md` BR-NOT-06, BR-ADM-01, BR-ADM-03, appendix "University Service Links" | Hub exposes configured links only, no record sync. Only administrators configure links. Configuration changes are audited with before/after values. |
| `docs/analysis-and-design/db/business-requirements.md` `ServiceLink` | `service_id, name, url, description, display_order, is_active`; administrator-managed. |
| `docs/requirements/vision-document.md` NFR-COM-01, NFR-SCA-INT-07 | Link to Moodle, Student Portal, tuition payment. A new service can be added within 1 week (here: by an admin, without a deploy). |
| `docs/api/openapi.yaml` v1.2.0, tag "University Services Hub" | `GET /hub/services`, `GET /hub/services/{serviceId}`, `GET/POST /admin/services`, `PATCH/DELETE /admin/services/{serviceId}`, ETag/If-Match, deactivate never deletes. |
| `docs/analysis-and-design/client/user-flow.md` §2.1, §1.5 | Landing page offers access to university services; students have a "University Services" sidebar page. |
| `src/client/src/features/landing/config/services.ts` | Current landing cards: six hard-coded services, locked behind a "Log in for more" overlay, display only. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a university service from the hub (Priority: P1) 🎯 MVP

A signed-in student, activity manager or administrator opens **University Services** from the navigation, sees the active services in the order the administrators set, and opens one. It opens in a new browser tab so myHCMUS stays open.

**Why this priority**: This is UC-07 itself. Without it the functional group delivers nothing.

**Independent Test**: Seed the database with service links, sign in as each role, open `/services`, check that only active links appear in display order and that selecting one opens its URL in a new tab.

**Acceptance Scenarios**:

1. **Given** a signed-in user of any role and three active links, **When** they open University Services, **Then** they see the three links with name and description, ordered by display order then name.
2. **Given** the hub is shown, **When** the user selects "Moodle", **Then** `https://courses.ctda.hcmus.edu.vn/` opens in a new tab with `noopener noreferrer`, and the hub stays open.
3. **Given** no active links exist, **When** the user opens the hub, **Then** an informative empty state is shown (UC-07 A1).
4. **Given** the backend is unreachable or returns an error, **When** the hub loads, **Then** a retryable error is shown and the Retry button reloads the list (UC-07 A4).
5. **Given** a link points to a site that is down, **When** the user opens it, **Then** the browser shows the external result; myHCMUS shows nothing extra (UC-07 A3).
6. **Given** a signed-out visitor, **When** they go to `/services`, **Then** they are sent to the login page and returned to `/services` after logging in.
7. **Given** an inactive link, **When** anyone calls `GET /hub/services/{id}` for it, **Then** the API answers 404.

---

### User Story 2 - Service cards on the landing page (Priority: P2)

The landing page already has a "Quick access to essential university services" section. A guest keeps seeing a locked preview with a "Log in for more" button. A signed-in user sees the same section unlocked, filled from the hub data, with each card opening its service, and a "See all services" link to the hub page.

**Why this priority**: It replaces the hard-coded, display-only cards with the managed data, so an admin change shows everywhere. The hub page (US1) already delivers the use case without it.

**Independent Test**: Load `/` signed out and check the locked preview; sign in, load `/` again and check the cards are links from the API and match `/services`.

**Acceptance Scenarios**:

1. **Given** a guest, **When** the landing page loads, **Then** the services section shows a locked, non-interactive preview and a "Log in for more" button that returns to `/#services` after login (current behaviour, kept).
2. **Given** a signed-in user, **When** the landing page loads, **Then** the section shows up to 6 active services from the API as clickable cards and a "See all services" link to `/services`.
3. **Given** a signed-in user and a failing API, **When** the landing page loads, **Then** the section shows a compact retryable error and the rest of the page still renders.

---

### User Story 3 - Administrators manage service links (Priority: P3)

A university administrator opens **Admin › University Services**, sees all links including inactive ones, and can add a link, edit its name, URL, description and order, deactivate it, or reactivate it. Every change is checked, is safe against two admins editing at once, and is written to the audit log.

**Why this priority**: Needed so links can change without a code change (BR-ADM-01, NFR-SCA-INT-07). Seed data covers US1 and US2 until this exists.

**Independent Test**: Sign in as an administrator, add "HCMUS Library", see it appear on `/services` for a student, deactivate it, see it disappear, and check the audit log has one row per change with before/after values.

**Acceptance Scenarios**:

1. **Given** an administrator, **When** they open Admin › University Services, **Then** they see active and inactive links with status, order and URL.
2. **Given** valid input (name 1–100 chars, absolute `http`/`https` URL), **When** they add a link, **Then** it is saved, shown in the list, and appears in the hub for all roles if active.
3. **Given** a URL such as `javascript:alert(1)`, `ftp://x`, or `moodle.hcmus.edu.vn` (no scheme), **When** they save, **Then** the form shows a field error and nothing is saved; the API independently rejects it with 400.
4. **Given** a name already used by another link (case-insensitive, trimmed), **When** they save, **Then** they see "A service with this name already exists" (409) and nothing is saved.
5. **Given** two admins open the same link, **When** the second saves after the first, **Then** the second gets "This link was changed by someone else, reload to see the latest" (412) and their change is not applied.
6. **Given** an active link, **When** the admin deactivates it and confirms, **Then** it disappears from the hub, stays in the admin list as Inactive, and can be reactivated.
7. **Given** a student or manager, **When** they call any `/admin/services` endpoint or open the admin page, **Then** the API answers 403 and the page shows the forbidden page.
8. **Given** any create, update, deactivate or reactivate, **When** it succeeds, **Then** one `AuditLog` row records actor, action, entity `ServiceLink`, id, reason, and before/after values, in the same transaction.

### Edge Cases

- Display order ties: sort by display order, then name (case-insensitive), then id, so the order is stable.
- Display order not given on create: the link goes to the end (max + 1).
- Name or description with leading/trailing spaces: trimmed before validation and saving; an empty description is stored as null.
- URL with spaces, credentials (`https://user:pass@host`), or longer than 2048 characters: rejected.
- A deactivated link opened in another tab: following the stored URL still works in the browser (it's external); the hub list no longer shows it after reload.
- `DELETE` on an already inactive link: succeeds and changes nothing (idempotent), no extra audit row.
- `PATCH` with an empty body or unknown fields only: 400.
- Non-numeric or unknown `serviceId`: 404, not 500.
- Database down: hub endpoints return 503 with a retryable message; the FE shows the A4 error state.
- Token missing, expired or malformed: 401; the FE sends the user to login.
- Account deactivated after login: permission check fails, 403.
- Many links (more than about 30): the hub shows them all in a responsive grid; no pagination (the contract returns small reference lists whole).

## Requirements *(mandatory)*

### Functional Requirements

**Hub (all roles)**

- **FR-001**: System MUST provide a University Services page reachable from the navigation of every role (student, manager, administrator).
- **FR-002**: The page MUST list only active service links, ordered by display order, then name, then id.
- **FR-003**: Each link MUST show its name and description (if any) and open its URL in a new tab with `rel="noopener noreferrer"`, with an accessible label saying it opens in a new tab.
- **FR-004**: The page MUST show an empty state when no active links exist (UC-07 A1) and a retryable error state when loading fails (UC-07 A4), and a loading skeleton while loading.
- **FR-005**: The hub page and hub API MUST require an authenticated user (UC-07 precondition). Signed-out visitors are redirected to login with a safe return path.
- **FR-006**: myHCMUS MUST NOT proxy, embed, call, or exchange data with the external services (BR-NOT-06). It only stores and renders links.

**Landing page**

- **FR-007**: For guests the landing services section MUST stay a locked, non-interactive preview with "Log in for more" (current behaviour).
- **FR-008**: For signed-in users the landing services section MUST render up to 6 active links from the same source as the hub page, as clickable cards, plus a link to the full hub.

**Administration**

- **FR-009**: Only accounts holding the `hub.services.manage` permission (granted to the administrator role) MUST be able to list all links, create, update, deactivate, and reactivate them (BR-ADM-01).
- **FR-010**: Reading the hub MUST require the `hub.services.read` permission, granted to all three roles.
- **FR-011**: The system MUST validate at the API: name trimmed, 1–100 chars, unique case-insensitively; URL absolute, scheme `http` or `https`, no credentials, at most 2048 chars; description at most 500 chars or null; display order an integer 0–9999; `isActive` boolean. Invalid input returns 400 with per-field errors. The FE MUST run the same checks before sending.
- **FR-012**: Links MUST never be physically deleted. `DELETE /admin/services/{id}` sets `is_active = false`; reactivation is `PATCH` with `isActive: true`.
- **FR-013**: Every admin mutation MUST support optimistic concurrency: responses carry `ETag: "<version>"`, mutations accept `If-Match`, a stale value returns 412 and the FE asks the admin to reload (contract convention, UC-30 A9 pattern).
- **FR-014**: Every successful admin change MUST write one `AuditLog` row (actor, action, entity type `ServiceLink`, entity id, reason, before, after) in the same transaction as the change (BR-ADM-03, BR-ADM-09).
- **FR-015**: Deactivate MUST ask the admin to confirm in the UI before calling the API.

**Integration**

- **FR-016**: The frontend MUST get hub data through a service interface with a mock implementation and a real implementation selected by `NEXT_PUBLIC_DATA_SOURCE`, as the activities feature does.
- **FR-017**: In `api` mode the frontend MUST reach the backend through a server-side route on the Next.js app that attaches the backend access token from an httpOnly cookie, so the token never reaches browser JavaScript and the backend needs no CORS.
- **FR-018**: Initial service links MUST be the six links agreed with the team (Moodle, Student Portal, Course Registration Portal, Special Programs Portal, Tuition Payment, Student Handbook 2025), all active; the HCMUS website row from `seed.sql` is kept but inactive. See data-model.md.

### Key Entities

- **ServiceLink** (existing table): one external university service. Name, URL, optional description, display order, active flag, and (new) a version number for concurrency.
- **AuditLog** (existing table): append-only record of each admin change to a ServiceLink.
- **Permission / RolePermission** (existing tables): two new permission codes, `hub.services.read` and `hub.services.manage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user reaches any configured service in at most 2 clicks from any page (navigation, then the card).
- **SC-002**: The hub list loads in under 1 second at p95 on the local Docker setup with 50 links.
- **SC-003**: An administrator adds a new service and it is visible to students on next load, with no code change or deploy (NFR-SCA-INT-07), in under 2 minutes.
- **SC-004**: 100% of admin mutations in the integration tests produce exactly one matching audit row; 0 links are ever deleted.
- **SC-005**: Every acceptance scenario above has an automated test (backend `node --test`, frontend Vitest + Testing Library), and the hub page and admin page pass the existing axe-core accessibility check with no violations.
- **SC-006**: Hub UI works from 360 px to 1920 px wide with no hidden actions (NFR-POR-03).

## Assumptions

- Each account has exactly one role (BR-ADM-12). Backend role codes are `student`, `manager`, `administrator`; the frontend's `admin` maps to `administrator` in one place.
- No category, icon or audience field is added. The OpenAPI contract states the BR defines none. UC-07's "categorized links" is met by admin-controlled display order. Icons are chosen on the frontend from a small map keyed by a slug of the name, with a generic fallback icon.
- The landing preview for guests keeps using the static config list (names and icons only, never links), because the hub API requires login. It is a picture, not data.
- Interface language switching (UC-08) is not built yet; strings stay in one config file per feature so they can be translated later. Admin-entered names and descriptions are shown as entered.
- The Authentication functional group is not part of this feature. Real end-to-end use in `api` mode needs a backend token for a user that exists in the database. This feature adds only the minimum bridge (FR-017) and a dev script to mint a token for a seeded user; see research.md R-01.
- Usage analytics (who clicked what) are out of scope; the vision does not ask for them.
