# Tasks: Public Landing Page

**Input**: Design documents from `/specs/001-landing-page/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the implementation plan and source specification explicitly require deterministic verification of formatting, mapping, activity states, service gating, grid behavior, navigation, and accessibility. Test tasks precede the implementation they validate where practical.

**Organization**: The user requested five logical phases. This list preserves those phases while using user-story phases for independent delivery slices. Phase 1 and Phase 2 are shared foundation; Phases 3-7 are user stories in priority order; Phase 8 is integration; Phase 9 is quality assurance. All paths are relative to `src/client`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase; different files and no incomplete dependency.
- **[Story]**: `[US1]` through `[US5]`, matching `spec.md`.
- Every task includes an exact file path and a verification or acceptance condition.

## Path Conventions

- Single Next.js application rooted at `src/client`.
- Application code: `src/`.
- Shared test harness: `tests/`.
- Feature code: `src/features/<feature>/`.
- Static assets: `public/images/`.

---

## Phase 1: Project and Shared Foundation

**Purpose**: Establish test tooling, shared contracts, tokens, utilities, and the auth-state prerequisite used by all stories.

- [x] T001 Add development-only test tooling and scripts to `package.json`: `vitest`, `@vitejs/plugin-react`, `jsdom`, `vite-tsconfig-paths`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `axe-core`; add `"test": "vitest run"` and `"test:watch": "vitest"`. Verify `npm install` succeeds and `npm test -- --passWithNoTests` runs. Covers plan Testing Strategy.
- [x] T002 [P] Create `vitest.config.ts` with the React plugin, `jsdom` environment, `vite-tsconfig-paths`, `tests/setup.ts`, and test-file patterns. Verify `npm test -- --passWithNoTests` loads the config. Covers plan Testing Strategy.
- [x] T003 [P] Create `tests/setup.ts` with jest-dom matchers and jsdom shims for `matchMedia`, `IntersectionObserver`, `scrollIntoView`, `HTMLDialogElement.showModal`, and `HTMLDialogElement.close`; add shared mocks for `next/image` and `next/navigation` only where required. Verify a trivial render test passes. Covers plan Testing Strategy.
- [x] T004 [P] Create `tests/test-utils.tsx` with a typed render helper and `expectNoA11yViolations` using `axe-core`. Verify the helper can render a simple component without importing feature internals. Covers FR-063 through FR-070 and SC-008.
- [x] T005 [P] Create `src/types/navigation.ts` with `SectionId` (`home`, `about`, `activities`, `services`, `help`, `contact`) and `NavigationLink` (`id`, `label`, `href: \`#${SectionId}\``); create `src/types/site.ts` with `FooterContent` (`brandDescription`, `contactHeading`, `address`, `phones`, `email`, `quickLinksHeading`, `quickLinks`). Verify `tsc` accepts the shapes from `data-model.md`. Covers FR-003, FR-054, and FR-072.
- [x] T006 [P] Extend `src/libs/api-client.ts` so `api.get<T>(endpoint, options?)` accepts `Omit<RequestOptions, "body" | "method">`, forwards `signal`, and preserves base URL, header, and error normalization; replace touched `any` with `unknown` where safe. Verify a test double confirms the `AbortSignal` reaches `fetch`. Covers Constitution III and plan API Integration Strategy.
- [x] T007 [P] Add landing design tokens to `src/app/globals.css` through the Tailwind `@theme` layer: primary `#1F4FA3`, primary-dark `#17409A`, accent-gold `#F2B31B`, text `#111827`, text-muted `#6B7280`, surface `#FFFFFF`, success `#16A34A`, warning `#D97706`, neutral-status `#6B7280`, guide gradient `#FFFFFF` to `#E3EEFB`, card radius `24px`, pill radius `9999px`, card shadow `0 8px 24px rgba(0, 0, 0, 0.10)`, container `1200px`, gutter `24px`, header height `56px`, and a focus-ring token. Verify no new component needs a raw hex value. Covers FR-058 through FR-067 and plan Design Tokens.
- [x] T008 [P] Wire the existing Geist import in `src/app/layout.tsx` with `Geist({ variable: "--font-geist-sans", subsets: ["latin"] })`, apply its variable class, set the body font from the token layer in `src/app/globals.css`, and remove or neutralize the `prefers-color-scheme: dark` override. Verify the landing renders with Geist and remains light under dark-mode preference. Covers FR-066 and plan Typography.
- [x] T009 [P] Add `src/libs/format.test.ts` covering same-day `dd/MM/yyyy, H:mm - H:mm`, multi-day `dd/MM/yyyy H:mm - dd/MM/yyyy H:mm`, midnight, leading-zero minutes, Asia/Ho_Chi_Minh boundary, and invalid dates. Verify the tests fail before T010. Covers FR-034.
- [x] T010 [P] Implement `src/libs/format.ts` with `formatActivityTime(start: Date, end: Date): string` using `Intl.DateTimeFormat` and `formatToParts` in `Asia/Ho_Chi_Minh`, 24-hour, non-padded hour, and two-digit minutes. Verify T009 passes. Covers FR-034.
- [x] T011 [P] Add `src/libs/navigation.test.ts` covering `getDashboardPath` for student/organizer/admin, `getLoginHref` encoding, valid landing return paths, and rejection of absolute URLs, protocol-relative URLs, backslashes, control characters, and `/login`. Verify the tests fail before T012. Covers FR-007, FR-008, and FR-015.
- [x] T012 [P] Add `getDashboardPath(role)`, `getLoginHref(returnTo?)`, and `isSafeRedirectPath(value)` to `src/libs/navigation.ts`, resolving dashboard paths from `NAVIGATION_ITEMS` and returning a role dashboard fallback for invalid values. Verify T011 passes. Covers FR-007, FR-008, and FR-015.
- [x] T013 [P] Create `src/libs/service-mode.ts` exposing a single mock/API selection helper based on `NEXT_PUBLIC_DATA_SOURCE`, defaulting to `mock`. Verify no component or hook reads the environment variable directly. Covers plan Selection and Mock Strategy.
- [x] T014 [P] Fix the stale `useMemo` dependencies in `src/features/auth/provider/AuthProvider.tsx` so `isLoading` and `refreshUser` are included. Verify a consumer observes loading-to-guest/authenticated changes without remounting. Covers FR-009 and FR-047.
- [x] T015 [P] Add the optional `NEXT_PUBLIC_MOCK_AUTH_STATE=guest|student|organizer|admin` scenario to `src/features/auth/services/mock.auth.service.ts`, defaulting to `student` to preserve current behavior; guest must reject `getMe()` so `AuthProvider` clears the user. Verify the existing scratch `src/app/test/page.tsx` still renders `LoginForm` without a redirect prop. Covers FR-009, FR-047, and quickstart guest QA.
- [x] T016 [P] Add local landing assets under `public/images/landing/`: `hero.*`, `highlight-activities.*`, `highlight-journey.*`, `highlight-campus.*`, and `activity-placeholder.*`; reuse `public/images/hcmus-campus.png` or approved source assets, do not use remote Unsplash URLs, and reserve image dimensions. Verify the files exist and are referenced only through config. Covers FR-017, FR-035, FR-074, and FR-075.

**Checkpoint**: Foundation ready. Test harness, shared types, API options, tokens, formatter, navigation helpers, service mode, auth-loading fix, and local assets exist.

---

## Phase 2: Reusable UI Components

**Purpose**: Build token-backed primitives and site chrome that every landing section reuses.

- [x] T017 [P] Create `src/components/ui/Button.tsx` and `src/components/ui/Button.test.tsx`: variants `primary | secondary | white | ghost`, sizes `sm | md | lg`, `href` rendering through `next/link`, `isLoading` with `aria-busy`, disabled links not focusable, and token-backed focus rings. Verify the test covers link/button/disabled/loading. Covers UI contract `Button` and FR-062/FR-064.
- [x] T018 [P] Create `src/components/ui/Container.tsx` and `src/components/ui/Section.tsx`: container max-width/gutter from tokens; semantic `<section>` with optional `id`, `labelledBy`, `background="none|primary-dark"`, and `scroll-margin-top` from the header-height token. Verify anchors land below the floating header. Covers FR-003, FR-012, and FR-063.
- [x] T019 [P] Create `src/components/ui/SectionHeader.tsx` with `id`, `eyebrow`, `title` rendered as `h2`, optional `description`, `align="left|center|split"`, and `tone="light|dark"`. Verify split alignment stacks on narrow screens and dark tone uses on-primary tokens. Covers FR-063 and plan Responsive Design.
- [x] T020 [P] Create `src/components/ui/Badge.tsx` and `src/components/ui/Tag.tsx`: badge tones `success | warning | neutral | info`, optional decorative dot hidden from assistive technology, always-visible text; tag is a non-interactive small label. Verify status is never color-only. Covers FR-032 and FR-070.
- [x] T021 [P] Create `src/components/ui/Skeleton.tsx`, `src/components/ui/EmptyState.tsx`, and `src/components/ui/ErrorState.tsx`: decorative pulse block with `aria-hidden` and `motion-reduce:animate-none`; empty state with optional icon/title/description/action; error state with fixed copy and a real retry button that never renders raw server text. Verify the retry button has a visible focus ring. Covers FR-037, FR-038, FR-067, and FR-068.
- [x] T022 [P] Create `src/components/ui/SurfaceCard.tsx` with a token-backed white surface, card radius, shadow, and optional guide gradient. Verify it adds no link or role by itself. Covers UI contract `SurfaceCard`.
- [x] T023 [P] Add one icon per file in `src/components/icons/`: `ArrowRightIcon.tsx`, `CalendarIcon.tsx`, `LocationIcon.tsx`, `LockIcon.tsx`, `MenuIcon.tsx`, and `CloseIcon.tsx`; all decorative icons use `aria-hidden` unless a caller supplies an accessible label. Verify no inline SVG duplicates appear in feature components. Covers FR-005, FR-013, FR-041, and FR-051.
- [x] T024 [P] Create `src/components/layout/Logo.tsx` and `src/components/layout/CopyrightYear.tsx`: wordmark with gold/primary token treatment, default link to `/` with accessible name "myHCMUS home", light variant, and a client-only current-year island. Verify the footer year changes at presentation time rather than being build-time text. Covers FR-006 and FR-055.

**Checkpoint**: Primitives and site chrome are ready for landing composition.

---

## Phase 3: User Story 1 - Guest Landing Shell and Orientation (Priority: P1) - MVP

**Goal**: A guest can load `/`, understand the platform, see all six sections, see activity loading placeholders and grouped activity success, and use Get Started and Explore the activities.

**Independent Test**: Load `/` as a guest with `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO=success`; verify the header, hero, highlights, activities, services shell, help, and footer render in order, up to two featured and three compact activities appear, the header shows Log In, Get Started targets login, Explore moves to `#activities`, and activity cards link to `/activities/{id}`.

### Tests for User Story 1

- [x] T025 [P] [US1] Add `src/features/landing/components/HeroActions.test.tsx` covering guest Get Started → `/login`, Explore → configured `#activities`, and auth-loading guest-safe behavior. Verify the test fails before T032. Covers FR-015 and FR-016.
- [x] T026 [P] [US1] Add `src/features/landing/components/GuideCard.test.tsx` covering an available whole-card link and an unavailable non-interactive card with no dead link. Verify the test fails before T035. Covers FR-052 and FR-053.
- [x] T027 [P] [US1] Add `src/components/layout/SiteHeader.test.tsx` covering guest desktop rendering: brand, five links, Log In, and no Dashboard. Verify the test fails before T037. Covers FR-005 and FR-007.

### Implementation for User Story 1

- [x] T028 [P] [US1] Create `src/features/landing/config/nav.ts` and `src/features/landing/config/sections.ts` with the five header links, six section ids/order, and `contact` target. Verify header and footer can share the same `NavigationLink[]`. Covers FR-003, FR-005, and FR-072.
- [x] T029 [P] [US1] Create `src/features/landing/config/hero.ts` and `src/features/landing/config/highlights.ts` with the hero headline/subtitle/CTA labels, configurable activities target, three highlight entries, image sources, and alt text. Keep pending headline wording in one constant. Covers FR-014 through FR-019 and FR-072.
- [x] T030 [P] [US1] Create `src/features/landing/config/guides.ts`, `src/features/landing/config/footer.ts`, and `src/features/landing/config/seo.ts` with four guide entries, `href: string | null`/`available` flags, footer content, contact details, and page metadata. Do not invent unavailable destinations or final copy. Covers FR-051 through FR-057 and FR-073.
- [x] T031 [US1] Create `src/features/landing/components/HeroVisual.tsx` as a client component using `next/image` with `preload` and `sizes="100vw"`, plus a token-backed fallback that preserves the hero layout on load failure. Verify the hero text remains readable over the fallback. Covers FR-017, FR-074, and FR-075.
- [x] T032 [US1] Create `src/features/landing/components/HeroActions.tsx` as a client component: guest/loading Get Started uses `/login`; authenticated uses `getDashboardPath(user.role)`; Explore uses the configured activities target. Verify T025 passes. Covers FR-015 and FR-016.
- [x] T033 [US1] Create `src/features/landing/components/HeroSection.tsx` as a server component with exactly one `h1`, subtitle, `HeroVisual`, and `HeroActions`. Verify the hero content is left-aligned and the two actions stack at narrow widths. Covers FR-014, FR-063, and FR-060.
- [x] T034 [US1] Create `src/features/landing/components/FeatureCard.tsx` and `src/features/landing/components/HighlightsSection.tsx`: exactly three informational cards with image, `h3`, and description; no link wrapper. Verify the section uses the split header and three-column wide layout. Covers FR-018, FR-019, and FR-058.
- [x] T035 [US1] Create `src/features/landing/components/GuideCard.tsx` and `src/features/landing/components/HelpSection.tsx`: four cards in a 2x2 wide grid, whole-card link when available, uppercase configured title, arrow, hover/focus cue, and non-interactive unavailable presentation. Verify T026 passes. Covers FR-051 through FR-053 and FR-059/FR-060.
- [x] T036 [US1] Create `src/components/layout/SiteFooter.tsx` as a server component with `id="contact"`, brand area, contact area with `tel:`/`mailto:` links, quick links from `nav.ts`, bottom bar, and `CopyrightYear`. Verify the footer receives `FooterContent` through props and does not import landing config. Covers FR-054 through FR-057.
- [x] T037 [US1] Create `src/components/layout/SiteHeader.tsx` as a client component guest baseline: floating pill, `Logo`, five section links, and Log In. Reserve a fixed-width auth placeholder while `useAuth().isLoading`; do not show Dashboard yet. Verify T027 passes. Covers FR-005, FR-007, and FR-009.
- [x] T038 [P] [US1] Create `src/features/landing/config/services.ts` with the four confirmed entries from the source design, `access: "public" | "authenticated"`, `available` flags, and no invented names/icons for the two pending entries. Verify the grid remains usable with fewer than six confirmed entries. Covers FR-041, FR-042, and FR-050.
- [x] T039 [US1] Create `src/features/landing/components/ServiceCard.tsx` and `src/features/landing/components/ServicesSection.tsx` as the presentational shell: icon/logo tile, name, "Access" affordance, 3x2 wide layout, and `locked` visual treatment from config only. Do not wire auth gating yet; US3 owns that behavior. Verify all six section shells render. Covers FR-041, FR-042, FR-058, and FR-059.
- [x] T040 [US1] Create `src/features/landing/components/LandingPage.tsx` composing `SiteHeader`, `main`, `HeroSection`, `HighlightsSection`, a temporary activity placeholder, `ServicesSection`, `HelpSection`, and `SiteFooter`; create `src/features/landing/index.ts` exporting only `LandingPage`. T049 replaces the placeholder with `ActivitiesSection`. Verify no route imports a feature internal folder. Covers FR-002 and plan Feature public APIs.
- [x] T041 [US1] Create `src/app/(public)/page.tsx` as a Server Component exporting `metadata` from `config/seo.ts` and rendering `<LandingPage />`; remove the conflicting `src/app/page.tsx` after confirming `/` resolves once. Verify `npm run build` reports no duplicate-route error. Covers FR-001, FR-002, and FR-073.
- [x] T042 [US1] Create `src/features/activities/types/activity.dto.ts`, `src/features/activities/types/activity.ts`, `src/features/activities/types/index.ts`, and a basic `src/features/activities/mappers/activity.mapper.ts` for grouped success: preserve title exactly, parse ISO dates, form `/activities/${encodeURIComponent(id)}`, and return the domain collection. Verify the mapper returns two featured and three upcoming for valid grouped fixtures. Covers FR-029 and FR-034.
- [x] T043 [US1] Create `src/features/activities/services/activity.fixtures.ts` and `src/features/activities/services/mock.activity.service.ts` with a deterministic `success` scenario (2 featured, 3 upcoming) and a short latency; the mock must use the same mapper as the real service. Verify the mock returns domain types only. Covers plan Mock Strategy and SC-004.
- [x] T044 [US1] Create `src/features/activities/services/activity.service.ts` with the `ActivityService` interface, `RealActivityService` calling `api.get<LandingActivitiesResponseDTO>("/activities/landing", { signal })`, and `activity.service.factory.ts` as the only module importing both implementations. Verify no component or hook imports a concrete service. Covers Constitution IV and contract `activity-service.md`.
- [x] T045 [US1] Create `src/features/activities/hooks/useLandingActivities.ts` with loading and success states, an AbortController on mount/unmount, and `refetch()`. Verify the hook returns `data: null` during loading and a domain collection on success. Covers FR-021 and FR-022.
- [x] T046 [P] [US1] Create `src/features/activities/components/ActivitiesSkeleton.tsx` matching the grouped footprint of two featured cards and three compact rows, with `aria-hidden` blocks and reduced-motion support. Verify the skeleton reserves the same dimensions as the success layout. Covers FR-022, FR-023, FR-067, and FR-075.
- [x] T047 [P] [US1] Create `src/features/activities/components/ActivityCard.tsx` and `src/features/activities/components/ActivityGrid.tsx` for the basic success path: featured/compact variants, whole-card link, 2+3 grouped layout, and no nested link for "View". Verify a featured card contains image, title, categories, date/time, location, status, and View; compact contains thumbnail, title, one category, date/time, and location. Covers FR-025 and FR-029 through FR-033.
- [x] T048 [US1] Create `src/features/activities/components/ActivitiesSection.tsx` rendering the section header and either `ActivitiesSkeleton` or `ActivityGrid`; create `src/features/activities/index.ts` exporting only `ActivitiesSection`. Verify the header remains visible during loading. Covers FR-020 and FR-022.
- [x] T049 [US1] Integrate `ActivitiesSection` from `src/features/activities/index.ts` into `src/features/landing/components/LandingPage.tsx` through the activities public barrel and verify the six-section order and anchors. Verify no direct import of `features/activities` internals from landing. Covers FR-002, FR-003, and plan Feature public APIs.
- [x] T050 [US1] Run the US1 tests and manual checks from `specs/001-landing-page/quickstart.md` sections 1, 2, and 5 with the `success` mock scenario; verify `src/features/landing/components/LandingPage.tsx` renders all six sections, 2+3 cards, guest Log In, Get Started, Explore, and activity links. Record any pending copy/asset dependencies. Covers US1 and SC-001/SC-002.

**Checkpoint**: US1 MVP is independently demoable with grouped activity success and all six section shells.

---

## Phase 4: User Story 2 - Activity Discovery Outcomes (Priority: P2)

**Goal**: Activity discovery handles loading, success, partial, empty, error, retry, single-list, malformed, and long-content cases without degrading the rest of the page.

**Independent Test**: Drive the activity section through `success`, `partial`, `empty`, `error`, `delay`, `single-list`, `all-invalid`, and `long-content` mock scenarios; verify the correct body, announcements, retry behavior, layout, and no duplicate content.

### Tests for User Story 2

- [x] T051 [P] [US2] Add `src/features/activities/mappers/activity.mapper.test.ts` covering grouped/single-list shapes, required/optional fields, invalid-item filtering, all-invalid errors, caps after filtering, href encoding, status mapping, timezone validation, reversed intervals, and title preservation. Verify the edge cases fail before T057. Covers FR-024, FR-027, FR-034, FR-040, and data-model mapping rules.
- [x] T052 [P] [US2] Add `src/features/activities/services/activity.service.test.ts` covering `RealActivityService` path/signal/unwrap/map/error propagation and `MockActivityService` interface/scenario parity. Verify the test uses no environment variables. Covers contract `activity-service.md` and SC-004.
- [x] T053 [P] [US2] Add `src/features/activities/hooks/useLandingActivities.test.tsx` covering loading, success, empty, error, retry, abort on unmount, stale response ignored, repeated retry settling once, and mapper error becoming error state. Use a deferred fake service. Verify the test fails before T063. Covers FR-039 and FR-040.
- [x] T054 [P] [US2] Add `src/features/activities/components/ActivitiesSection.test.tsx` covering header visibility in every state, skeleton, success, empty, error with Try again, retry to loading, polite announcements, no focus jump, and no duplicate content. Verify the test fails before T066. Covers FR-020 through FR-023, FR-037 through FR-039, and FR-068.
- [x] T055 [P] [US2] Add `src/features/activities/components/ActivityGrid.test.tsx` covering 2 featured + 3 compact, 1 featured + compact, featured-only 1/2 spanning width, upcoming-only featured-style grid up to 5/max 3 columns, and empty never rendering a grid. Verify the test fails before T061. Covers FR-024 through FR-028.
- [x] T056 [P] [US2] Add `src/features/activities/components/ActivityCard.test.tsx` covering whole-card link/no nested link, four-line and three-line clamps, optional categories/location omitted, image fallback, status text plus non-color cue, and multi-day date rendering. Verify the test fails before T060. Covers FR-029 through FR-036.

### Implementation for User Story 2

- [x] T057 [US2] Expand `src/features/activities/mappers/activity.mapper.ts`: detect grouped versus single-list shape, reject both/neither, filter invalid records, treat missing groups as empty, throw `InvalidLandingActivitiesError` with `INVALID_PAYLOAD` or `NO_USABLE_ITEMS`, and apply caps after filtering. Verify T051 passes. Covers FR-024, FR-027, and FR-040.
- [x] T058 [P] [US2] Create `src/features/activities/components/ActivityStatusBadge.tsx` and `src/features/activities/components/ActivityMeta.tsx`: open/upcoming/closed labels with text plus dot/icon; date/time from `formatActivityTime`; omit missing categories/location without punctuation. Verify no raw status enum is shown. Covers FR-029 through FR-036.
- [x] T059 [P] [US2] Create `src/features/activities/components/ActivityImage.tsx` using `next/image` with stable dimensions and an `onError`/null fallback to the local branded placeholder. Verify card dimensions do not change when the image fails. Covers FR-035 and FR-075.
- [x] T060 [US2] Expand `src/features/activities/components/ActivityCard.tsx`: featured and compact variants, four-line/three-line clamps, exact title preservation without uppercase transformation, status only on featured, whole-card link, and no nested "View" link. Verify T056 passes. Covers FR-029 through FR-036.
- [x] T061 [US2] Expand `src/features/activities/components/ActivityGrid.tsx` with all four layout rules and responsive reflow: featured left/compact right, featured-only spanning width, upcoming-only featured-style max-three-column grid, and no empty grid. Verify T055 passes. Covers FR-024 through FR-028 and FR-058 through FR-060.
- [x] T062 [P] [US2] Expand `src/features/activities/components/ActivitiesSkeleton.tsx` to mirror the grouped layout, preserve height during single-list reflow, use `aria-hidden` blocks, and disable pulse under reduced motion. Verify no clipping or horizontal scroll occurs when success replaces loading. Covers FR-022, FR-023, FR-067, and FR-075.
- [x] T063 [US2] Expand `src/features/activities/hooks/useLandingActivities.ts` to a discriminated state machine with loading/success/empty/error, request ids, abort handling, retry, stale-response protection, and no render throws. Verify T053 passes. Covers FR-039, FR-040, and FR-068.
- [x] T064 [US2] Expand `src/features/activities/services/mock.activity.service.ts` and `activity.fixtures.ts` with `success`, `partial`, `empty`, `error`, `delay`, `single-list`, `all-invalid`, and `long-content` scenarios selected by `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO`; simulate latency and cancellation. Verify every scenario is deterministic. Covers SC-004 and quickstart activity matrix.
- [x] T065 [US2] Expand `src/features/activities/services/activity.service.ts` so `RealActivityService` passes the signal, unwraps `data`, maps, and propagates normalized errors; keep factory selection through `src/libs/service-mode.ts`. Verify T052 passes and no component imports the mock. Covers Constitution III/IV and contract `activity-service.md`.
- [x] T066 [US2] Expand `src/features/activities/components/ActivitiesSection.tsx` and create `src/features/activities/config.ts` with section header, status labels, empty copy, and error copy; render exactly one body per state, keep the header visible, announce loading/empty/error politely, and move focus to the stable section heading on retry. Verify T054 passes. Covers FR-020 through FR-023, FR-037 through FR-039, and FR-068.
- [x] T067 [US2] Integrate the expanded `src/features/activities/components/ActivitiesSection.tsx` into `src/features/landing/components/LandingPage.tsx` and verify the rest of the page remains usable in every activity outcome. Verify no activity error can hide or disable header, hero, highlights, services, help, or footer. Covers FR-004 and SC-010.
- [x] T068 [US2] Run the US2 test suites in `src/features/activities/` and `specs/001-landing-page/quickstart.md` activity matrix for all eight scenarios, including repeated retry and single-list reflow. Verify no duplicate content, clipping, overlap, or horizontal scrolling. Covers US2 and SC-003/SC-004.

**Checkpoint**: US2 is independently testable across every activity outcome.

---

## Phase 5: User Story 3 - Services Require Sign-In (Priority: P3)

**Goal**: A guest can use public services, sees protected services as blurred and unreachable, and relies on the header Log In action; authenticated users see every service unlocked.

**Independent Test**: Load the services section as guest, loading, and authenticated; verify public services are usable, protected services have no destination/focus/AT exposure, loading uses the locked presentation, authenticated unlocks all, and no overlay invitation exists.

### Tests for User Story 3

- [x] T069 [P] [US3] Add `src/features/landing/components/ServicesSection.test.tsx` covering guest, authenticated, and loading states; public links usable; protected cards blurred, inert, `aria-hidden`, no href; no overlay; stable DOM dimensions. Verify the test fails before T073. Covers FR-043 through FR-048 and SC-005.
- [x] T070 [P] [US3] Add `src/features/landing/components/ServiceCard.test.tsx` covering locked versus unlocked rendering, external link `target`/`rel`, accessible name, no text selection, and no destination in locked DOM. Verify the test fails before T072. Covers FR-044, FR-045, and FR-049.

### Implementation for User Story 3

- [x] T071 [US3] Update `src/features/landing/config/services.ts` with `access`, `available`, confirmed hrefs, and confirmed local icons only; keep the two pending entries out rather than inventing names or destinations. Verify the grid remains usable with four confirmed services. Covers FR-041, FR-042, and FR-050.
- [x] T072 [US3] Update `src/features/landing/components/ServiceCard.tsx` for locked semantics: no `<a>`, no href, `inert`, `aria-hidden="true"`, no text selection, visual-only Access affordance; unlocked cards are whole-card links with accessible names and external `target="_blank"`/`rel="noopener noreferrer"`. Verify T070 passes. Covers FR-044 through FR-049.
- [x] T073 [US3] Update `src/features/landing/components/ServicesSection.tsx` to read `useAuth()`: loading and guest use the locked presentation; authenticated unlocks all; keep identical outer dimensions; render no invitation overlay. Verify T069 passes. Covers FR-043 through FR-048.
- [x] T074 [P] [US3] Add confirmed service logo/icon assets under `public/images/services/` and wire them through config; do not create assets for the two pending entries. Verify every confirmed service has a meaningful accessible name or decorative icon as appropriate. Covers FR-041, FR-049, and FR-050.
- [x] T075 [US3] Integrate the gated `src/features/landing/components/ServicesSection.tsx` into `src/features/landing/components/LandingPage.tsx` and verify guest, auth-loading, and authenticated states at wide and narrow widths. Verify the header Log In action is the only sign-in path from services. Covers US3 and FR-046.
- [x] T076 [US3] Run the US3 tests in `src/features/landing/components/ServicesSection.test.tsx` and `specs/001-landing-page/quickstart.md` guest/signed-in services checks; verify zero protected services are reachable by keyboard, pointer, or assistive technology for guests. Covers SC-005 and SC-006.

**Checkpoint**: US3 is independently testable and conversion-safe.

---

## Phase 6: User Story 4 - Signed-In Continuity (Priority: P4)

**Goal**: Signed-in students, organizers, and administrators can still use `/`, see a role-correct Dashboard action, and access every service without a forced redirect.

**Independent Test**: Load `/` as each signed-in role; verify no redirect, header Dashboard goes to the correct role dashboard, Get Started goes to the role dashboard, and all services are unlocked.

### Tests for User Story 4

- [x] T077 [P] [US4] Extend `src/features/landing/components/HeroActions.test.tsx` for authenticated student/organizer/admin and auth-loading guest-safe behavior. Verify each role resolves the correct dashboard path. Covers FR-015 and SC-007.
- [x] T078 [P] [US4] Extend `src/components/layout/SiteHeader.test.tsx` for authenticated student/organizer/admin Dashboard paths, loading skeleton, and no signed-in-only action flash. Verify the header never shows Dashboard during loading. Covers FR-008, FR-009, and SC-007.

### Implementation for User Story 4

- [x] T079 [US4] Update `src/components/layout/SiteHeader.tsx` so the auth action renders Log In for guests, a reserved skeleton for loading, and Dashboard for authenticated users via `getDashboardPath(user.role)`; preserve the existing guest return path. Verify T078 passes. Covers FR-008 and FR-009.
- [x] T080 [P] [US4] Update `src/features/landing/components/HeroActions.tsx` so authenticated Get Started goes directly to `getDashboardPath(user.role)` while guest/loading still uses the guest-safe login path. Verify T077 passes. Covers FR-015.
- [x] T081 [P] [US4] Update `src/features/landing/components/ServicesSection.tsx` so authenticated users see every available service unlocked and no auth-loading locked state persists after resolution. Verify no layout shift occurs on unlock. Covers FR-047 and FR-048.
- [x] T082 [US4] Verify `src/app/(public)/page.tsx` has no forced redirect for authenticated users and that student/organizer/admin Dashboard links from `src/components/layout/SiteHeader.tsx` resolve to `/student/dashboard`, `/organizer/dashboard`, and `/admin/dashboard`. Verify the existing proxy is not modified for this feature. Covers FR-001, FR-008, and SC-007.
- [x] T083 [US4] Run the US4 tests in `src/features/landing/components/HeroActions.test.tsx` and `src/components/layout/SiteHeader.test.tsx`, plus `specs/001-landing-page/quickstart.md` signed-in checks for all three roles. Verify no backend or auth-service refactor is included. Covers US4 and SC-007.

**Checkpoint**: US4 is independently testable for every role.

---

## Phase 7: User Story 5 - Predictable Navigation (Priority: P5)

**Goal**: Visitors can use header links, direct hashes, browser history, and the mobile drawer predictably, with active-section indication and correct focus behavior.

**Independent Test**: Use header links, direct `/#section` addresses, browser Back/Forward, keyboard-only navigation, and the mobile drawer; verify header offset, URL hash updates, active indication, modal focus containment, scroll lock, Escape/backdrop close, and focus restoration.

### Tests for User Story 5

- [x] T084 [P] [US5] Add `src/libs/scroll.test.ts` covering `scrollToSection` hash updates, reduced-motion immediate scrolling, header offset, and `useScrollSpy` active-section selection. Verify the test fails before T086. Covers FR-010, FR-011, and FR-067.
- [x] T085 [P] [US5] Extend `src/components/layout/SiteHeader.test.tsx` for active `aria-current`, visible non-color cue, login return path, mobile dialog focus containment, Escape/backdrop close, scroll lock, section selection, and focus restoration. Verify the test fails before T087/T088. Covers FR-010 through FR-013 and FR-069.

### Implementation for User Story 5

- [x] T086 [US5] Create `src/libs/scroll.ts` with `scrollToSection(id)`, header-aware offset, `history.pushState`, reduced-motion handling, hash restoration on load/`hashchange`/`popstate`, and `useScrollSpy(ids)` using `IntersectionObserver`. Verify T084 passes. Covers FR-010, FR-011, FR-012, and FR-067.
- [x] T087 [US5] Update `src/components/layout/SiteHeader.tsx` to use `useScrollSpy`, `scrollToSection`, `aria-current="location"`, a visible underline/weight cue, and `getLoginHref` with the active section. Verify T085 header/nav assertions pass. Covers FR-007, FR-010, and FR-011.
- [x] T088 [US5] Add the mobile modal drawer to `src/components/layout/SiteHeader.tsx`: native `<dialog>`, same five links plus auth action, focus containment, background inert, scroll lock, Escape/backdrop close, section-selection close, and focus restoration to the trigger. Verify T085 mobile assertions pass. Covers FR-013 and FR-069.
- [x] T089 [P] [US5] Update `src/features/landing/components/HeroActions.tsx` so Explore uses the configured target and `scrollToSection`/hash update while remaining configurable for a later `/activities` page. Verify the URL reflects `#activities`. Covers FR-016 and FR-010.
- [x] T090 [US5] Add direct-hash restoration and header-aware positioning for `/#services` and every section on first load and Back/Forward in `src/libs/scroll.ts`; share the header-height token with `src/components/ui/Section.tsx` scroll margin. Verify the target is not hidden under the floating header. Covers FR-010, FR-012, and SC-012.
- [x] T091 [P] [US5] Update `src/components/layout/Logo.tsx` or its header usage so the brand returns to the top of the landing page and remains a single accessible home link. Verify the brand does not trigger a full-page reload. Covers FR-006.
- [x] T092 [P] [US5] Update `src/components/forms/LoginForm.tsx` to accept an optional sanitized `redirectTo` prop, use `router.replace` after successful login, reject `/login` targets, and fall back to `getDashboardPath(user.role)`. Update `src/app/(public)/login/page.tsx` to read the async `searchParams` promise and pass the value; keep `src/app/test/page.tsx` working without the prop. Verify guest Log In from `#services` returns there. Covers FR-007 and plan Authentication Return Behavior.
- [x] T093 [US5] Integrate navigation helpers, hash restoration, and the login return path into `src/components/layout/SiteHeader.tsx` and `src/features/landing/components/HeroActions.tsx`; verify no direct `window.location` navigation or duplicated scroll logic exists. Covers FR-010 through FR-013.
- [x] T094 [US5] Run the US5 tests in `src/components/layout/SiteHeader.test.tsx` and `specs/001-landing-page/quickstart.md` navigation/mobile-drawer checks, including direct hashes, Back/Forward, keyboard-only use, Escape, backdrop, and focus restoration. Covers US5 and SC-012.

**Checkpoint**: US5 is independently testable on desktop and narrow screens.

---

## Phase 8: Integration and Cross-Cutting Wiring

**Purpose**: Verify that the independently delivered slices compose into one landing page without boundary, content, or data-state gaps.

- [x] T095 [P] Verify `src/features/landing/index.ts` exports only `LandingPage` and `src/features/activities/index.ts` exports only `ActivitiesSection`; ensure routes, shared layout, and sibling features never import another feature's internal folders. Verify with an import search and `npm run build`. Covers Constitution II and plan Feature public APIs.
- [x] T096 [P] Verify `src/app/(public)/page.tsx` renders `<LandingPage />` with metadata, `src/app/page.tsx` is removed, and `/login` remains unaffected by the public layout. Verify `/` resolves once and `/login` still renders `LoginForm`. Covers FR-001, FR-002, FR-073, and plan Routing.
- [x] T097 [P] Verify all section copy, nav labels, highlights, services, guides, footer content, and SEO values come from `src/features/landing/config/*.ts`; verify activity header/status/empty/error copy comes from `src/features/activities/config.ts`; remove duplicated inline copy. Covers FR-071, FR-072, and plan Content Configuration.
- [x] T098 [P] Verify the activity mock is the default, `NEXT_PUBLIC_DATA_SOURCE=api` selects the real service, `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` drives every scenario, and no production module imports the mock outside the factory in `src/features/activities/services/activity.service.factory.ts` and `src/libs/service-mode.ts`. Verify the real endpoint is not enabled without a confirmed contract. Covers plan Selection and Mock Strategy and quickstart Mock Configuration.
- [x] T099 [P] Verify local hero/highlight/activity images and the activity placeholder are used from `public/images/landing/`, no remote Unsplash URLs remain in `src/features/landing/config/`, image dimensions are reserved, and remote activity hosts are not guessed. Verify a failed hero and activity image preserve layout through `src/features/activities/components/ActivityImage.tsx`. Covers FR-017, FR-035, FR-074, and FR-075.
- [x] T100 [P] Verify guest Get Started → login → role dashboard, header Log In from `#services` → login → `#services`, and authenticated Get Started/header Dashboard → role dashboard through `src/components/forms/LoginForm.tsx` and `src/app/(public)/login/page.tsx`. Verify invalid `redirectTo` values fall back safely. Covers FR-007, FR-008, FR-015, and SC-007.
- [x] T101 [P] Verify the six sections appear in order with stable ids `home`, `about`, `activities`, `services`, `help`, and `contact` in `src/features/landing/components/LandingPage.tsx` and `src/features/landing/config/sections.ts`; exactly one `h1`, section titles as `h2`, card titles as `h3`, and landmarks for header/main/sections/footer. Covers FR-002, FR-003, FR-063, and FR-064.
- [x] T102 [P] Verify no backend code, API route, proxy behavior, auth service contract, or unrelated feature was modified; inspect `git status` and `git diff` for `src/client/package.json` and `src/client/src/` and list only frontend landing/auth-adjacent files. Covers scope discipline and user constraint "Do not modify backend code."

**Checkpoint**: The integrated page satisfies the cross-section behavior and boundary rules.

---

## Phase 9: Quality Assurance and Polish

**Purpose**: Validate responsive behavior, accessibility, type safety, linting, visual consistency, and release readiness.

- [x] T103 Run `npm run lint` from `package.json` and fix all new errors/warnings in `src/features/landing/`, `src/features/activities/`, `src/components/ui/`, `src/components/layout/`, and auth-adjacent changes. Verify the command exits cleanly. Covers constitution quality gates.
- [x] T104 Run `npm run build` and fix all TypeScript/build errors in `src/app/(public)/page.tsx`, `src/features/landing/`, `src/features/activities/`, and `src/components/`; confirm the route, metadata, Server/Client boundaries, and Next.js 16 `preload` usage build successfully. Covers constitution quality gates and plan Next.js constraints.
- [x] T105 Run `npm test` and ensure all unit/component tests under `src/features/landing/`, `src/features/activities/`, `src/libs/`, and `src/components/ui/` pass, including formatter, navigation, mapper, service, hook, activity states, grid, card, services gating, header, guide card, and Button. Covers SC-004, SC-005, and SC-008.
- [x] T106 [P] Verify responsive behavior at 320, 375, 640, 768, 1024, 1440, and 1920 pixels using `src/features/landing/components/` and `src/features/activities/components/ActivityGrid.tsx`: no horizontal scrolling, correct highlight/service/guide columns, hero action stacking, activity reflow, and compact horizontal cards. Covers FR-058 through FR-062 and SC-009.
- [x] T107 [P] Verify keyboard and assistive-technology behavior in `src/components/layout/SiteHeader.tsx`, `src/features/landing/components/ServicesSection.tsx`, and `src/features/activities/components/ActivitiesSection.tsx`: logical tab order, visible focus, semantic landmarks/headings, status text plus non-color cues, locked services excluded, modal drawer containment, and no focus drop during activity outcomes. Covers FR-063 through FR-070 and SC-008.
- [x] T108 [P] Run `axe-core` through `tests/test-utils.tsx` against the header, activity success/empty/error, services guest/auth, and footer rendered from `src/features/landing/` and `src/features/activities/`; record zero critical violations and fix regressions. Covers SC-008.
- [x] T109 [P] Verify WCAG 2.1 AA contrast for hero headline over the campus visual, white text on primary-dark services/footer, muted metadata, guide gradients, and status indicators using tokens in `src/app/globals.css` and components under `src/features/landing/` and `src/features/activities/`. Covers FR-066 and SC-011.
- [x] T110 [P] Enable reduced motion and verify `src/libs/scroll.ts`, `src/components/ui/Skeleton.tsx`, and `src/features/landing/components/` suppress smooth scrolling, hover lift, and skeleton pulse while preserving state changes. Covers FR-067.
- [x] T111 [P] Execute the full `specs/001-landing-page/quickstart.md` verification matrix against `src/features/landing/components/LandingPage.tsx`, including image failure, network throttling, repeated retry, single-list reflow, direct hashes, mobile drawer, and all three auth roles; record results and unresolved release dependencies. Covers SC-001 through SC-012.
- [x] T112 [P] Review the rendered page against `docs/ui/landing-page-ui.png` for hierarchy, spacing, card treatment, header pill, hero gradient, services blur, guide decorations, and footer structure using `src/features/landing/components/`; fix token/visual inconsistencies without hardcoded colors. Verify final scope contains no backend changes and no invented product content.

**Checkpoint**: The landing page is release-ready except for explicitly documented content/backend dependencies.

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies; start immediately.
- **Phase 2**: Depends on Phase 1 tokens/types; blocks landing composition.
- **Phase 3 (US1)**: Depends on Phase 1 and Phase 2; delivers the MVP shell, grouped activity success, and all six section shells.
- **Phase 4 (US2)**: Depends on US1 activity types/services; can begin once the US1 activity success path exists.
- **Phase 5 (US3)**: Depends on US1 services shell and Phase 1 auth memo fix; can run in parallel with US2 if staffed.
- **Phase 6 (US4)**: Depends on US1 header/hero/services and Phase 1 navigation helpers; can run in parallel with US2/US3 after US1.
- **Phase 7 (US5)**: Depends on US1 header/hero and Phase 1 navigation helpers; can run in parallel with US2/US3/US4 after US1.
- **Phase 8**: Depends on all desired user stories.
- **Phase 9**: Depends on Phase 8.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories; MVP.
- **US2 (P2)**: Uses US1 activity types and success path; independently testable across outcomes.
- **US3 (P3)**: Uses US1 services shell and shared auth state; independently testable for gating.
- **US4 (P4)**: Uses US1 header/hero/services and shared auth state; independently testable for roles.
- **US5 (P5)**: Uses US1 header/hero; independently testable for navigation.

### Within Each Story

- Write the listed tests first and confirm the expected failure before implementation.
- Types and config before services/components.
- Services and mappers before hooks.
- Primitive cards before grids/sections.
- Integrate only through public feature barrels.
- Do not modify backend code, API routes, or the proxy for this feature.

### Parallel Opportunities

- Phase 1 test harness tasks T002-T004 are parallel after T001.
- Phase 1 shared utilities T009-T016 are largely parallel by file, except T010 depends on T009 and T012 depends on T011.
- Phase 2 primitives T017-T024 are parallel by file.
- US1 config tasks T028-T030 are parallel; T038 can run alongside them.
- US1 activity presentation T046-T047 can run in parallel after activity types.
- US2 tests T051-T056 are parallel; implementation T058, T059, and T062 can run alongside mapper work.
- US3 tests T069-T070 are parallel; config/icons T071/T074 can run before card/section gating.
- US4 test tasks T077-T078 are parallel; header/hero/services updates T079-T081 touch different files.
- US5 tests T084-T085 are parallel; scroll utilities and login redirect can be developed alongside header work once tests exist.
- Phase 8 checks T095-T102 are independent verification tasks and can be assigned to different reviewers.
- Phase 9 manual checks T106-T112 can run in parallel by different reviewers, while T103-T105 are sequential quality gates.

---

## Parallel Example: User Story 1

```text
Task: "Add HeroActions.test.tsx for guest/loading targets"
Task: "Add GuideCard.test.tsx for available/unavailable destinations"
Task: "Add SiteHeader.test.tsx for guest header"
```

## Parallel Example: User Story 2

```text
Task: "Add activity.mapper.test.ts"
Task: "Add activity.service.test.ts"
Task: "Add useLandingActivities.test.tsx"
Task: "Add ActivitiesSection.test.tsx"
Task: "Add ActivityGrid.test.tsx"
Task: "Add ActivityCard.test.tsx"
```

## Parallel Example: User Story 5

```text
Task: "Add scroll.test.ts"
Task: "Extend SiteHeader.test.tsx for active/mobile/login return"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3) to deliver the public shell, all six sections, grouped activity success, and guest orientation.
3. Stop and validate US1 with `quickstart.md` sections 1, 2, and 5.
4. Deploy/demo the MVP before adding outcome, gating, role, and navigation refinements.

### Incremental Delivery

1. Foundation + primitives → landing shell.
2. US2 → trustworthy activity outcomes.
3. US3 → services conversion path.
4. US4 → signed-in continuity.
5. US5 → navigation and mobile polish.
6. Integration and QA → release candidate.

### Parallel Team Strategy

After US1, assign US2 (activity outcomes), US3 (services), US4 (roles), and US5 (navigation) to separate developers. US2/US3 touch activity/services files; US4/US5 touch header/hero/navigation files. Coordinate shared files (`SiteHeader.tsx`, `HeroActions.tsx`, `ServicesSection.tsx`, `LandingPage.tsx`) through one owner per file.

---

## Notes

- [P] tasks are safe to run in parallel only when they touch different files and their listed dependencies are complete.
- Tests are required by the plan/source specification; run them before marking the paired implementation complete.
- Every user story is independently demoable at its checkpoint.
- Do not add runtime dependencies; test dependencies are dev-only and justified in `plan.md`.
- Do not modify backend code, API routes, or the existing proxy for this feature.
- Pending product inputs remain configurable: two service names/icons, hero headline wording, help destinations, footer copy, and the confirmed activity contract/image host.




