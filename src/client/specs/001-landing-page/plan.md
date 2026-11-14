# Implementation Plan: Public Landing Page

**Branch**: `001-landing-page` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-landing-page/spec.md`

## Summary

Build the public `/` Landing Page as a Server Component shell with client islands for authentication, navigation, activity discovery, and service gating. The page composes the six specified sections from configuration modules, uses feature-first modules under `features/landing` and `features/activities`, and consumes activities through an `ActivityService` contract with paired real and mock implementations. The current `src/app/page.tsx` is replaced by `src/app/(public)/page.tsx` to remove the route conflict. Activity data is fetched client-side so a slow or failed request never blocks the rest of the page. The design system gains shared tokens, UI primitives, layout chrome, and explicit loading/empty/error/success states. The backend contract remains an explicit assumption; the mock service is the default implementation until it is confirmed.

## Technical Context

**Language/Version**: TypeScript 5 with React 19.3 and Next.js 16.4.3 (App Router).

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS v4, existing `@/libs/api-client`, existing `@/hooks/useAuth`, `next/link`, `next/image`, existing `@/libs/roles` and `@/libs/navigation`. No new runtime dependency is required.

**Storage**: N/A for this feature. Authentication state continues to come from the existing session/auth layer; the landing page only reads `useAuth()` and does not read cookies directly.

**Testing**: Add Vitest, React Testing Library, jsdom, and `axe-core` as development-only dependencies. Use `npm run lint` and `npm run build` as mandatory quality gates. Tests are colocated with source modules; shared setup and render helpers live in `tests/`.

**Target Platform**: Modern evergreen browsers; responsive from 320px through 1920px; Next.js Node.js build/runtime.

**Project Type**: Web application frontend (single Next.js application).

**Performance Goals**: Render the static hero, header, highlights, help, and footer immediately; preload only the hero visual; keep below-the-fold images lazy; replace activity placeholders without layout shift; reach a terminal activity outcome within 3 seconds for at least 95% of visits on a 10 Mbps connection; no horizontal scrolling at any supported width.

**Constraints**: Public route with no forced redirect for signed-in visitors; no raw `fetch` outside `src/libs/api-client.ts`; no hardcoded colors; four explicit activity states; mock/real service parity; WCAG 2.1 AA; 44x44px touch targets; reduced-motion support; no invented service names, guide destinations, or final copy.

**Scale/Scope**: One public page, six sections, one proposed activity endpoint, two feature modules, shared UI/layout additions, and no backend changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Evidence in this plan | Result |
|-----------|------|-----------------------|--------|
| I. App Router and TypeScript First | Routes stay under `src/app`; Server Components are the default; strict typing; no new `any` | New `/` route lives in `src/app/(public)/page.tsx`; static sections are Server Components; only interactive islands use `"use client"`; new production signatures avoid `any` | PASS |
| II. Feature-First Architecture | Capabilities live under `src/features/<name>`; routes stay thin; no direct cross-feature internals | `features/landing` composes the page and `features/activities` owns activity discovery. Public `index.ts` barrels expose `LandingPage` and `ActivitiesSection`; routes and sibling features do not import internal folders. Shared layout receives navigation/footer data through props typed by `src/types`, so `components/layout` does not import feature configs | PASS |
| III. Centralized HTTP | All HTTP goes through `src/libs/api-client.ts` | `RealActivityService` calls `api.get`; `api.get` is extended to accept `RequestInit` options such as `signal`; no component or hook calls `fetch` | PASS |
| IV. Service Contracts with Mocks | Interface plus real/mock implementations behind one selection point | `ActivityService` is defined in `features/activities/services`; real and mock classes implement it; `activity.service.factory.ts` is the only production selection point; the mock supports success, partial, empty, error, delay, and single-list scenarios | PASS, with the existing auth-service gap noted below |
| V. DTO and Domain Separation | Wire DTOs and domain types are separate; mappers own conversion | `activity.dto.ts` mirrors the provisional wire shape; `activity.ts` defines domain models; `activity.mapper.ts` validates and maps; components consume domain types only | PASS |
| VI. Token-Based Design System | Tokens in `globals.css`; primitives in `components/ui`; chrome in `components/layout` | New color, radius, shadow, spacing, and focus tokens are added to the Tailwind `@theme` layer; shared primitives and site chrome are placed in the prescribed layers; landing and activity components use token-backed utilities | PASS |
| VII. Explicit Data States | Loading, empty, error, and success are all rendered | `useLandingActivities` exposes a discriminated state machine; `ActivitiesSection` renders matching skeleton, empty, error, and grid bodies while keeping the header visible | PASS |
| VIII. Accessibility and Separation | Semantic HTML, keyboard support, focus management, no class components | Landmarks and heading levels follow the spec; the mobile drawer uses a native modal `<dialog>`; focus returns to the trigger; reduced motion is honored; service and mapping logic stay outside components | PASS |
| Additional Constraints | Approved stack; no unjustified runtime dependency; inspect and reuse; no unnecessary restructuring; route boundaries; scope discipline | No runtime dependency is added; test dependencies are dev-only and justified; existing `api-client`, `useAuth`, navigation helpers, icons, forms, and images are reused; the only restructure is the required root-route move; no speculative product features are added | PASS |

**Existing implementation note**: `features/auth` predates the constitution and currently lacks a shared service interface/selection point while `AuthProvider` hardcodes `mockAuthService`. The landing feature does not copy that gap or depend on auth internals; it consumes the shared `useAuth()` hook. The auth-adjacent changes are limited to: the required safe `redirectTo` handling in `LoginForm`; a minimal `AuthProvider` context-memoization fix so `isLoading` changes actually reach consumers; and an optional mock-only guest/auth scenario for QA. The full auth-service refactor is out of scope.

## Architecture

### Rendering boundaries

| Boundary | Component | Why |
|----------|-----------|-----|
| Server | `src/app/(public)/page.tsx` | Owns route metadata, static shell, and SEO output |
| Server | `features/landing/components/LandingPage.tsx` | Composes static sections and client islands without browser APIs |
| Server | `HeroSection`, `HighlightsSection`, `HelpSection` | Static content and images; no client state |
| Server | `components/layout/SiteFooter.tsx` | Static footer content; a small client island renders the current year |
| Client | `HeroActions` | Reads `useAuth()` to choose Get Started behavior |
| Client | `SiteHeader` | Reads auth state, scroll-spy, and mobile menu state |
| Client | `ActivitiesSection` | Fetches data and owns the activity state machine |
| Client | `ServicesSection` | Reads auth state to gate services |
| Client | `HeroVisual`, activity image wrapper | Handles image failure fallback without breaking layout |
| Existing client | `components/forms/LoginForm.tsx` | Accepts a sanitized `redirectTo` prop from the login route and uses it after successful sign-in |

`app/(public)/layout.tsx` remains a pass-through so the landing page composes its own header and footer and `/login` is unaffected. The old `src/app/page.tsx` is removed after its useful content is migrated.

### Component hierarchy

```text
RootLayout
└── Provider (existing AuthProvider)
    └── (public)/page.tsx (Server)
        └── LandingPage (Server)
            ├── SiteHeader (Client; receives NavigationLink[] from landing config)
            │   ├── Logo
            │   ├── desktop section navigation
            │   ├── auth action: Log In | Dashboard | reserved skeleton
            │   └── mobile modal drawer (native <dialog>)
            ├── main
            │   ├── HeroSection (Server)
            │   │   ├── HeroVisual (Client; image fallback)
            │   │   └── HeroActions (Client; Get Started / Explore)
            │   ├── HighlightsSection (Server)
            │   │   └── FeatureCard x3 (not links)
            │   ├── ActivitiesSection (Client)
            │   │   ├── SectionHeader
            │   │   ├── ActivitiesSkeleton
            │   │   ├── ActivityGrid
            │   │   │   └── ActivityCard (featured | compact) x up to 5
            │   │   ├── EmptyState
            │   │   └── ErrorState
            │   ├── ServicesSection (Client)
            │   │   └── ServiceCard x6 (public or locked)
            │   └── HelpSection (Server)
            │       └── GuideCard x4
            └── SiteFooter (Server; receives FooterContent from landing config)
                ├── brand
                ├── contact
                ├── quick links (reuses nav config)
                └── bottom bar
                    └── CopyrightYear (Client; current year at presentation)
```

### Feature public APIs

- `features/landing/index.ts` exports only `LandingPage`.
- `features/activities/index.ts` exports only `ActivitiesSection`.
- Routes and sibling features import those barrels, never another feature's internal folders. Internals import within their own feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── activities-api.md
│   ├── activity-service.md
│   └── ui-components.md
└── tasks.md             # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # NEW: server route, metadata, <LandingPage />
│   │   ├── layout.tsx                # unchanged pass-through
│   │   └── login/page.tsx            # read redirectTo searchParam and pass it to LoginForm
│   ├── page.tsx                      # REMOVE: conflicts with (public)/page.tsx
│   ├── globals.css                   # add landing design tokens and base focus styles
│   └── layout.tsx                    # wire the existing Geist import to the font token
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── Badge.tsx
│   │   ├── Tag.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   └── SurfaceCard.tsx
│   ├── layout/
│   │   ├── SiteHeader.tsx
│   │   ├── SiteFooter.tsx
│   │   ├── CopyrightYear.tsx
│   │   └── Logo.tsx
│   ├── icons/
│   │   ├── ArrowRightIcon.tsx
│   │   ├── CalendarIcon.tsx
│   │   ├── LocationIcon.tsx
│   │   ├── LockIcon.tsx
│   │   ├── MenuIcon.tsx
│   │   └── CloseIcon.tsx
│   └── forms/LoginForm.tsx           # accept and apply a sanitized redirectTo prop
├── features/
│   ├── auth/services/mock.auth.service.ts  # optional mock-only guest/auth QA scenario
│   ├── landing/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HeroVisual.tsx
│   │   │   ├── HeroActions.tsx
│   │   │   ├── HighlightsSection.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── ServiceCard.tsx
│   │   │   ├── HelpSection.tsx
│   │   │   └── GuideCard.tsx
│   │   ├── config/
│   │   │   ├── nav.ts
│   │   │   ├── hero.ts
│   │   │   ├── sections.ts
│   │   │   ├── highlights.ts
│   │   │   ├── services.ts
│   │   │   ├── guides.ts
│   │   │   ├── footer.ts
│   │   │   └── seo.ts
│   │   └── index.ts
│   └── activities/
│       ├── components/
│       │   ├── ActivitiesSection.tsx
│       │   ├── ActivitiesSkeleton.tsx
│       │   ├── ActivityGrid.tsx
│       │   ├── ActivityCard.tsx
│       │   ├── ActivityMeta.tsx
│       │   ├── ActivityStatusBadge.tsx
│       │   └── ActivityImage.tsx
│       ├── hooks/
│       │   └── useLandingActivities.ts
│       ├── mappers/
│       │   └── activity.mapper.ts
│       ├── services/
│       │   ├── activity.service.ts
│       │   ├── mock.activity.service.ts
│       │   ├── activity.service.factory.ts
│       │   └── activity.fixtures.ts
│       ├── types/
│       │   ├── activity.dto.ts
│       │   ├── activity.ts
│       │   └── index.ts
│       ├── config.ts               # section header, status labels, empty/error copy
│       └── index.ts
├── libs/
│   ├── api-client.ts                 # extend get() with RequestInit options
│   ├── format.ts                     # formatActivityTime()
│   ├── navigation.ts                 # getDashboardPath, getLoginHref, safe redirect
│   ├── scroll.ts                     # scrollToSection, useScrollSpy
│   └── service-mode.ts               # single mock/real selection helper
├── types/
│   ├── navigation.ts                 # shared SectionId and NavigationLink types
│   └── site.ts                       # shared FooterContent type for layout chrome
└── hooks/useAuth.ts                  # existing; reused unchanged

public/
└── images/
    ├── landing/
    │   ├── hero.jpg
    │   ├── highlight-activities.jpg
    │   ├── highlight-journey.jpg
    │   ├── highlight-campus.jpg
    │   └── activity-placeholder.png
    └── services/                    # add only confirmed service logos; do not invent missing entries

vitest.config.ts
tests/
├── setup.ts
└── test-utils.tsx
```

Colocated tests use `*.test.ts` and `*.test.tsx` beside the module under test. `tests/` contains only shared test environment and render helpers, not feature tests.

**Structure Decision**: The repository is a single Next.js web application. The feature uses the existing App Router route groups, feature-first layout, shared `libs`, shared UI/layout component layers, and the existing auth hook. The only structural move is replacing the conflicting root page with the route-group page required by the source design.

## Data Flow

### Page and navigation

```text
Request /
→ (public)/page.tsx (server metadata + shell)
→ LandingPage (server composition)
→ SiteHeader (client)
   ├─ useAuth() → Log In | Dashboard | reserved skeleton
   ├─ useScrollSpy(sectionIds) → aria-current and visible active cue
   └─ mobile dialog → same links + auth action
→ Section anchors update history and scroll below the floating header
```

- Section links use `scrollToSection(id)`, which updates the URL hash with `history.pushState`, scrolls the section into view with an offset, and respects reduced motion.
- Direct hashes and browser back/forward restore the target section through `hashchange`/`popstate` handling.
- The header login link carries the active section as a same-origin return path: `getLoginHref("/#services")`.

### Authentication and return behavior

```text
Guest header "Log In"
→ /login?redirectTo=<encoded landing location>
→ (public)/login/page.tsx reads searchParams.redirectTo and passes it to LoginForm
→ LoginForm sanitizes and uses the value
→ successful auth
→ router.replace(safeRedirectTo ?? getDashboardPath(user.role))

Guest hero "Get Started"
→ /login (no landing return target)
→ successful auth
→ role dashboard

Signed-in hero/header action
→ getDashboardPath(user.role)
```

- `getDashboardPath(role)` resolves the Dashboard entry from `NAVIGATION_ITEMS` so paths are not hardcoded in components.
- `redirectTo` is accepted only when it is a same-origin absolute path beginning with `/`, not `//`, contains no backslashes or control characters, resolves to the current origin, and does not target `/login`. Invalid values fall back to the role dashboard.
- The login route is an async Server Component that reads the Next.js `searchParams` promise and passes `redirectTo` to `LoginForm` as a prop. This avoids a client `useSearchParams` dependency and keeps the existing scratch page that renders `LoginForm` without a Suspense boundary working.

### Activity discovery

```text
ActivitiesSection (client)
→ useLandingActivities()
→ createActivityService()
   ├─ MockActivityService → deterministic DTO fixtures → activity.mapper → domain
   └─ RealActivityService → api.get("/activities/landing", { signal })
        → provisional response DTO → activity.mapper → domain
→ discriminated state
   ├─ loading → ActivitiesSkeleton (2 featured + 3 compact footprints)
   ├─ success → ActivityGrid → ActivityCard
   ├─ empty → EmptyState
   └─ error → ErrorState with Try again → refetch
```

- The hook aborts in-flight requests on unmount and before a retry; a late response cannot overwrite a newer outcome.
- The mapper filters unusable items first, then applies display caps: grouped mode keeps up to two featured and three compact items; single-list mode keeps up to five items and renders them in the featured style.
- The mapper throws a typed mapping error when the payload cannot be interpreted or when raw items were supplied but none are usable. The hook turns that into the error state.
- The rest of the page is server-rendered and remains usable regardless of the activity outcome.
- Activity service/mapping failures are contained by the hook's error state. No class-based section error boundary is added because class components are prohibited; if a render-time boundary becomes necessary, use the App Router's `error.tsx` pattern or a compliant future primitive.

### Services gating

```text
ServicesSection (client)
→ useAuth() → isLoading | guest | authenticated
→ config/services.ts
   ├─ isLoading or guest → public cards usable; authenticated-only cards locked
   └─ authenticated → all cards usable
```

- Locked cards are not links, expose no destination, are inert, have `aria-hidden="true"`, and are excluded from keyboard navigation.
- The locked and unlocked states use the same outer dimensions so unlocking does not shift layout.
- No separate invitation overlay is rendered over locked cards; the header Log In action is the sign-in path.

## API Integration Strategy

### Provisional HTTP contract

The backend contract is **not confirmed**. The plan uses one isolated provisional shape so a contract change affects only the DTO, mapper, and real service:

```text
GET /activities/landing
Auth: public
Response 200: { data: GroupedLandingActivitiesDTO | ListLandingActivitiesDTO }
Response 5xx/network/invalid payload: error outcome
```

- `GroupedLandingActivitiesDTO` contains `featured` and `upcoming` arrays.
- `ListLandingActivitiesDTO` contains a single `activities` array.
- The existing `types/api.ts` `ActionResult<T>` is not reused as a GET envelope because it models an application result, not an HTTP response. The provisional `{ data: ... }` envelope is documented as an assumption and cannot leak into components.
- If the confirmed backend contract differs, only `activity.dto.ts`, the mapper, and `RealActivityService` change; the service interface, hook, and UI remain stable.

### API client extension

- Extend `api.get` to accept optional `RequestInit` options so the activity service can pass an `AbortSignal`:

```ts
get: <T>(endpoint: string, options?: Omit<RequestOptions, "body" | "method">) =>
  apiRequest<T>(endpoint, "GET", options)
```

- Keep base URL resolution, headers, serialization, and error normalization in `src/libs/api-client.ts`.
- Replace touched `any` signatures with `unknown` where safe; do not introduce new `any` in production code.
- Use the existing normalized `Error`; the UI shows fixed user-facing copy and never renders a raw server error.

### Real service

- `RealActivityService implements ActivityService`.
- It calls `api.get<LandingActivitiesResponseDTO>("/activities/landing", { signal })`.
- It passes `response.data` to `mapLandingActivitiesDTO`.
- It does not construct URLs or handle authentication headers itself.

### Selection and mock strategy

- `src/libs/service-mode.ts` exposes one selection helper based on `NEXT_PUBLIC_DATA_SOURCE`; the default is `mock` until the backend contract is confirmed.
- `activity.service.factory.ts` is the only production module that imports both implementations.
- `NEXT_PUBLIC_DATA_SOURCE=api` selects the real service; any other value selects the mock.
- `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` controls deterministic mock fixtures: `success`, `partial`, `empty`, `error`, `delay`, `single-list`, and malformed-for-error cases.
- Tests inject a mock service instance or a deferred fake directly into the hook, avoiding environment dependence.

### Images

- Use local landing assets initially; do not add a remote host until the media host is confirmed.
- Hero image uses `next/image` with `preload` (Next.js 16; `priority` is deprecated) and `sizes="100vw"`.
- Below-the-fold images are lazy by default and reserve aspect-ratio dimensions.
- Activity images use a shared `ActivityImage` wrapper with an `onError` fallback to `activity-placeholder.png`; dimensions remain stable.
- Real activity image hosts require a confirmed `images.remotePatterns` allowlist. This is a release dependency, not an assumption to guess.

## State Management

### Activity state machine

```text
idle → loading → success | empty | error
                 ↑                │
                 └──── refetch ───┘
```

| State | Data | UI |
|-------|------|----|
| `loading` | `null` | Grouped skeleton footprint; region is `aria-busy="true"`; header remains visible |
| `success` | `LandingActivities` | Layout rules in `ActivityGrid`; cards use domain data |
| `empty` | zero usable items | EmptyState with the specified message and reserved height |
| `error` | `null` | ErrorState with Try again; no raw error text |

Implementation details:

- `useReducer` or an equivalent discriminated union keeps transitions explicit and prevents impossible combinations.
- `refetch()` aborts the current request, returns to `loading`, and starts a new request.
- The hook ignores aborted requests and responses from older request IDs.
- The hook never throws into render; it converts service and mapping failures into the error state.
- No global state library or data-fetching library is added. A single-section fetch does not justify a runtime dependency.

### Other local state

- **Header auth action**: `useAuth()` supplies `isLoading`, `isAuthenticated`, and `user`; a fixed-width placeholder prevents layout shift and prevents a signed-in-only action from flashing.
- **Services**: `isLoading` is treated as locked; the same DOM structure unlocks without layout shift.
- **Mobile drawer**: local open state backed by a native modal `<dialog>`; native focus containment, Escape handling, backdrop styling, body scroll lock, and focus restoration.
- **Scroll-spy**: `useScrollSpy` uses `IntersectionObserver` with a header-aware root margin; active state is exposed with `aria-current="location"` plus a visible non-color cue.
- **Hero actions**: while auth resolves, Get Started uses the guest-safe login path; the proxy redirects an existing session from `/login` to the dashboard if applicable.
- **Static content**: navigation, hero copy, shared section headers, highlights, services, guides, footer, and SEO values live in `features/landing/config/*.ts`; activity section header, status labels, and empty/error messages live in `features/activities/config.ts`. No copy is duplicated in components.

## Responsive and Accessibility Design

- Use Tailwind's default `sm` (640px) and `lg` (1024px) breakpoints; no custom breakpoint set is needed.
- At `lg` and above: three highlight columns, 3x2 services, 2x2 guides, and the two-featured-plus-three-compact activity layout.
- At `sm` to `lg - 1`: header uses the modal drawer, highlights/services use two columns, guides keep two columns, featured activities use two columns, and compact activities form a two-column stack below.
- Below `sm`: one column for highlights, services, and guides; hero actions stack full width; compact activity cards keep their horizontal presentation.
- Header height and `scroll-margin-top` share a token so anchors land below the floating header.
- The page uses `header`, `main`, `section`, and `footer` landmarks; one `h1`; section titles are `h2`; card titles are `h3`.
- Activity titles are rendered exactly as supplied. Do not apply `text-transform: uppercase` to activity content, even though the mock may supply uppercase strings.
- Status badges combine text, an icon/dot, and color; color is never the only cue.
- The mobile drawer uses semantic `<dialog>` and a labeled close control; background content is inert while open; focus returns to the trigger when it closes without navigation.
- Loading, empty, and error outcomes are announced through a polite status region without moving focus unexpectedly. On retry, focus moves to the stable activity section heading/container rather than being dropped to the page start; the terminal outcome is announced without further focus movement.
- Focus-visible rings use a shared token; no focus outline is removed without a replacement.
- Reduced motion disables smooth scrolling, hover lift, and pulse animation while preserving visible state changes.
- Touch targets are at least 44x44px; interactive text and indicators meet WCAG 2.1 AA contrast.

## Design Tokens and Typography

Add the following to `src/app/globals.css` through the Tailwind `@theme` layer (names may be adapted to Tailwind v4 conventions, but values remain tokenized):

| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#1F4FA3` | primary actions, links, eyebrow text |
| `--color-primary-dark` | `#17409A` | services/footer backgrounds |
| `--color-accent-gold` | `#F2B31B` | hero highlight and logo accent |
| `--color-text` | `#111827` | headings and body |
| `--color-text-muted` | `#6B7280` | descriptions and metadata |
| `--color-surface` | `#FFFFFF` | cards and header |
| `--color-success` | `#16A34A` | registration open |
| `--color-warning` | `#D97706` | registration upcoming |
| `--color-neutral-status` | `#6B7280` | registration closed |
| `--color-guide-gradient-from` | `#FFFFFF` | guide card top |
| `--color-guide-gradient-to` | `#E3EEFB` | guide card bottom |
| `--radius-card` | `24px` | cards |
| `--radius-pill` | `9999px` | buttons/header |
| `--shadow-card` | `0 8px 24px rgba(0, 0, 0, 0.10)` | cards |
| `--container-landing` | `1200px` | content container |
| `--page-gutter` | `24px` | horizontal page padding |
| `--header-height` | `56px` | header and scroll offset |
| `--focus-ring` | token-backed focus color/width | visible focus |

- The current `app/layout.tsx` imports Geist but never instantiates it, so `--font-geist-sans` is undefined and `globals.css` falls back to Arial. Wire the existing import with `Geist({ variable: "--font-geist-sans", subsets: ["latin"] })` and apply its variable class; do not add a new font package. Validate the visual match against the UI reference before choosing an alternative.
- Set the body font family from the token layer rather than leaving the current Arial fallback.
- The current `prefers-color-scheme: dark` override is not part of the landing design. Remove or neutralize it for the landing surface, or explicitly set the landing shell to light surface tokens. No dark theme is in scope.
- All new components use token-backed Tailwind utilities or CSS variables. No hex values in JSX or component class strings.

## Testing Strategy

### Tooling

Add development-only dependencies and scripts:

- `vitest`, `@vitejs/plugin-react`, `jsdom`, `vite-tsconfig-paths`
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `axe-core` for automated accessibility checks

Add `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json`. These are dev-only; no runtime dependency is introduced. The constitution's dependency justification is: there is no existing test runner, and the feature requires deterministic verification of mappers, state transitions, gating, and accessibility. `tests/setup.ts` provides the Testing Library matchers, `matchMedia`, `IntersectionObserver`, `scrollIntoView`, and `HTMLDialogElement.showModal`/`close` shims because jsdom does not implement them. Tests mock `next/image` and `next/navigation` where the real implementations require the Next.js runtime.

### Unit and component tests

- `libs/format.test.ts`:
  - same-day format, multi-day format, leading-zero hour/minutes, midnight, Vietnam timezone boundary, invalid dates.
- `libs/navigation.test.ts`:
  - `getDashboardPath` for all roles; `getLoginHref` encoding; safe redirect accepts valid landing paths and rejects absolute URLs, protocol-relative URLs, backslashes, control characters, and `/login`; invalid values fall back correctly.
- `features/activities/mappers/activity.mapper.test.ts`:
  - grouped and single-list payloads; required/optional fields; invalid items dropped; all-invalid payload throws; reversed/invalid intervals rejected; caps applied after filtering; href encoding; status mapping; title preservation.
- `features/activities/services/activity.service.test.ts`:
  - `RealActivityService` calls the API client with `/activities/landing` and the supplied signal, unwraps `data`, and maps; API errors propagate; `MockActivityService` satisfies the same interface and scenario contract.
- `features/activities/hooks/useLandingActivities.test.tsx`:
  - loading, success, empty, error; retry transitions; abort on unmount; stale response ignored; repeated retry settles once; mapper error becomes error state. Use a deferred fake service; no environment variables.
- `features/activities/components/ActivitiesSection.test.tsx`:
  - header remains visible in every state; loading skeleton; success grid; empty message; error message with retry; retry returns to loading; announcements do not move focus; no duplicate content.
- `features/activities/components/ActivityGrid.test.tsx`:
  - 2 featured + 3 compact; 1 featured + compact; featured only (1 and 2) spans available width; upcoming-only feature-style grid up to 5 and max 3 columns; empty never renders a grid.
- `features/activities/components/ActivityCard.test.tsx`:
  - whole-card link, no nested link; title line clamps; optional categories/location omitted; image fallback; status badge text and non-color indicator; multi-day date rendering.
- `features/landing/components/HeroActions.test.tsx`:
  - guest Get Started targets login; authenticated Get Started targets the role dashboard; loading uses the guest-safe path; Explore uses the configured target.
- `features/landing/components/ServicesSection.test.tsx`:
  - guest vs authenticated vs loading; locked cards have no href and are inert/hidden; public cards usable; no overlay invitation; no layout-shift structure.
- `features/landing/components/SiteHeader.test.tsx`:
  - guest/auth/loading actions; dashboard path per role; mobile dialog focus restore and Escape; active link `aria-current`; login return path.
- `features/landing/components/GuideCard.test.tsx`:
  - whole-card link; unavailable destination is non-interactive and not a dead link.
- `components/ui/Button.test.tsx` (focused):
  - link vs button rendering; disabled/loading; variants do not bypass tokens.

Tests should target client components and pure functions. Next.js async Server Components are not rendered directly in Vitest; the route shell and metadata are verified through `npm run build` and the quickstart checks.

### Accessibility checks

- Run `axe-core` against key client renders (header, activities success/empty/error, services guest/auth) through a shared `expectNoA11yViolations` helper.
- Manual keyboard and screen-reader checks remain mandatory for the modal drawer, scroll-spy announcements, activity outcome announcements, and service gating.
- Automated checks supplement, but do not replace, the spec's manual verification.

### Manual and E2E coverage

- Use `quickstart.md` for the release verification matrix.
- Playwright is not added now. If the project later needs CI-level browser coverage, add it as a separate justified change; the current plan keeps runtime and test dependencies minimal.

## Risks and Assumptions

1. **Activity contract is unconfirmed.** The `{ data: ... }` envelope and field names are provisional. The service boundary, mapper, mock, and DTO isolate the change.
2. **Activity image host is unknown.** Mock mode uses local assets. Real mode requires a confirmed host in `images.remotePatterns`; do not guess a broad allowlist.
3. **Two service names/icons, hero headline, help destinations, and footer copy are pending.** The layout remains usable, and unavailable guide destinations must be presented as unavailable rather than dead links.
4. **The existing auth mock auto-authenticates every visitor, and its context memoization is stale.** `AuthProvider` hardcodes `mockAuthService`, its `getMe()` always returns a student, and its `useMemo` omits `isLoading`/`refreshUser`, so consumers may not observe auth-loading changes. The plan includes a minimal memoization fix (required for the header skeleton and services gating) and an optional mock-only `NEXT_PUBLIC_MOCK_AUTH_STATE=guest|student|manager|admin` scenario (default `student` to preserve current behavior); `AuthProvider` already clears the user when `getMe()` rejects. If maintainers reject the mock-only scenario, guest rendering is covered by component tests and manual QA waits for the real backend.
5. **The existing proxy has an unrelated authenticated-`/login` redirect issue** (the redirect is returned inside `forEach`). The landing flow does not depend on it for guests; do not expand this feature into a proxy refactor.
6. **No test runner exists.** Test tooling is a planned dev-only addition and must be reviewed under the dependency rule.
7. **Root route move is required.** Keeping both `src/app/page.tsx` and `src/app/(public)/page.tsx` would create a route conflict, so the old page is removed after migration.
8. **`next/image` API differences in Next 16.** Use `preload`, not `priority`, for the hero; verify the correct `sizes` and fallback behavior in the installed Next.js docs.

## Post-Design Constitution Re-check

Phase 1 artifacts (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) are generated. Re-check result:

- No new runtime dependencies are introduced.
- No hardcoded colors are introduced in new components; all visual values map to the token layer.
- Routes and sibling features access only the public barrels `features/landing/index.ts` and `features/activities/index.ts`; shared layout receives navigation/footer data through props and shared `src/types`.
- The activity service contract, real/mock parity, DTO/domain split, and mapper boundary remain intact.
- All four activity states, auth-loading service gating, and header auth reservation remain explicit.
- Accessibility requirements are covered by semantics, native dialog behavior, focus restoration, reduced-motion handling, and automated plus manual checks.
- No constitutional violations or exceptions are required. The Complexity Tracking table remains empty.

## Complexity Tracking

No constitutional violations or exceptions are requested.
