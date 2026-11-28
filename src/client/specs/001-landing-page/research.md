# Phase 0 Research: Public Landing Page

**Feature**: `001-landing-page` | **Date**: 2026-11-13

This document records the technical decisions needed before implementation. The feature specification remains the source of user-visible behavior; this file resolves implementation choices and records assumptions.

## Decision 1: Route placement and the root-page conflict

**Decision**: Add `src/app/(public)/page.tsx` as a Server Component and delete the conflicting `src/app/page.tsx` after migrating any useful content. Keep `src/app/(public)/layout.tsx` as a pass-through.

**Rationale**:
- The App Router cannot have two pages resolving to `/`.
- The public route group already contains `/login`; the landing page composes its own header and footer, so `/login` remains unaffected.
- Deleting the old page is a correctness fix, not a preference-driven restructure.
- `src/app/(public)/page.tsx` owns metadata and the static shell, matching the source design.

**Alternatives considered**:
- Keep `src/app/page.tsx` and redirect from a nested route: rejected because it leaves a conflicting route and adds unnecessary indirection.
- Put the landing markup directly in the page: rejected because routes must stay thin and delegate to feature modules.

## Decision 2: Server shell with client islands

**Decision**: Keep `(public)/page.tsx` and `LandingPage` as Server Components. Add `"use client"` only to `SiteHeader`, `HeroActions`, `HeroVisual`, `ActivitiesSection`, `ServicesSection`, and the activity image wrapper. Keep `HeroSection`, `HighlightsSection`, `HelpSection`, and `SiteFooter` server-rendered.

**Rationale**:
- The static hero, highlights, help, and footer render immediately and remain independent of activity data.
- Auth-dependent actions and data-fetching states need client hooks.
- The design explicitly requires activity loading not to block the rest of the page.

**Alternatives considered**:
- Make the entire landing page a client component: rejected because it needlessly ships static markup to the client and weakens the Server Component default.
- Fetch activities on the server: rejected for this iteration because the activity contract is unconfirmed, the spec requires a client-side loading state, and a server fetch would make the whole route wait on an external service.

## Decision 3: Feature boundaries and public barrels

**Decision**: Use `features/landing` for page composition and `features/activities` for activity discovery. Add `features/landing/index.ts` and `features/activities/index.ts` as minimal public APIs. The route imports `LandingPage` from the landing barrel; landing imports `ActivitiesSection` from the activities barrel.

**Rationale**:
- The constitution requires feature-first organization and forbids importing another feature's internals.
- Public barrels make the intended boundary explicit while preserving the source design's feature split.
- Shared `components/layout` chrome receives navigation and footer data through props typed by `src/types/navigation.ts` and `src/types/site.ts`; shared layout never imports landing config.
- Auth remains accessed through the shared `src/hooks/useAuth.ts` hook, not through `features/auth` internals.

**Alternatives considered**:
- Put `ActivitiesSection` under `features/landing`: rejected because activity discovery is an independent capability with its own service, mapper, and hook.
- Import `features/activities/components/ActivitiesSection` directly from landing: rejected because it violates the feature-isolation rule.
- Move activity display entirely into shared components: rejected because it would spread activity semantics across layers.

## Decision 4: Activity service contract and selection point

**Decision**:
- Define `ActivityService` in `features/activities/services/activity.service.ts`.
- Implement `RealActivityService` in the same file and `MockActivityService` in `mock.activity.service.ts`.
- Select implementations only in `activity.service.factory.ts`.
- Add `src/libs/service-mode.ts` as the single source for `NEXT_PUBLIC_DATA_SOURCE`.
- Default to the mock until the backend contract is confirmed; select the real service when `NEXT_PUBLIC_DATA_SOURCE=api`.

**Rationale**:
- Satisfies the constitution's service-contract and paired-mock requirements.
- Keeps the mock out of production paths except at the single selection point.
- Allows the page to be developed and QA'd without a backend.
- The source design asks to reuse the auth switching mechanism, but auth currently hardcodes `mockAuthService`; a shared selection helper is the minimal way to avoid inventing multiple independent switches for the new feature.

**Alternatives considered**:
- Hardcode the mock in the hook: rejected because it prevents the real implementation from being swapped in and violates the contract rule.
- Use a runtime backend URL check: rejected because it is implicit and hard to test.
- Refactor the entire auth feature to the same selection point now: deferred; it is a pre-existing gap and not required to deliver the landing page.

## Decision 5: Provisional HTTP contract and envelope

**Decision**: Treat the backend contract as unconfirmed and isolate a provisional shape:

```text
GET /activities/landing
Response 200: { data: GroupedLandingActivitiesDTO | ListLandingActivitiesDTO }
```

- Grouped: `{ featured: ActivityDTO[], upcoming: ActivityDTO[] }`
- Single list: `{ activities: ActivityDTO[] }`

The DTO uses snake_case wire fields and ISO date strings. The mapper accepts the envelope only inside `RealActivityService`; domain types never include the envelope.

**Rationale**:
- The spec explicitly forbids assuming that proposed contracts are confirmed.
- The source document names `ApiResponse<LandingActivitiesDTO>`, but the codebase has `ActionResult<T>` in `types/api.ts`, which is an application result type, not a GET envelope. Reusing it would be misleading.
- A single documented assumption is easier to replace than scattered response handling.

**Alternatives considered**:
- Use `ActionResult<LandingActivitiesDTO>`: rejected because its `ok/error` shape is not the wire envelope shown by the backend proposal and would conflate transport with application results.
- Support both `{ data }` and a direct array at runtime: rejected because it doubles the contract surface and hides ambiguity; the mapper can be changed once when the backend is confirmed.
- Put the endpoint URL in the hook or component: rejected; the real service owns the endpoint string.

## Decision 6: DTO, domain model, and validation policy

**Decision**: Use explicit DTO and domain files with a pure mapper.

- DTOs mirror the provisional wire shape exactly.
- Domain `Activity` uses `Date`, camelCase fields, a `registrationStatus` union, and a derived `href`.
- `mapActivityDTO` returns `Activity | null`; required fields are `id`, non-empty `title`, valid `startTime`/`endTime` with `endTime >= startTime`, and a recognized registration status.
- Optional fields: image, categories, location. Blank categories/location are normalized to empty/`null`.
- `mapLandingActivitiesDTO` drops invalid items, then applies display caps: grouped → up to 2 featured and 3 upcoming; single list → up to 5 upcoming and no featured.
- If the payload cannot be interpreted, or if raw items were supplied but none are usable, the mapper throws `InvalidLandingActivitiesError`.
- Titles are preserved exactly as supplied; no case transformation is applied by the UI.

**Rationale**:
- Satisfies the DTO/domain separation principle.
- Implements the clarification: skip invalid items, error only when every returned item is unusable.
- Filtering before slicing allows valid later items to fill the display slots when earlier items are malformed.
- A typed mapping error lets the hook produce the error outcome without components knowing why mapping failed.

**Alternatives considered**:
- Let components validate raw DTOs: rejected because it leaks transport shapes and business rules into rendering.
- Throw on the first invalid item: rejected because the clarification requires usable items to continue rendering.
- Use a schema library in every mapper: rejected as unnecessary for a single endpoint; explicit validators are simpler and testable. Zod is already available if the confirmed contract later needs it.

## Decision 7: Activity hook state machine

**Decision**: Implement `useLandingActivities` as an explicit discriminated state machine with `loading`, `success`, `empty`, and `error`. Use `useReducer` or an equivalent exhaustive state model. Use `AbortController` and a request id so stale responses cannot overwrite newer outcomes. `refetch()` aborts the current request and restarts in `loading`.

**Rationale**:
- The constitution requires all four states.
- A discriminated union prevents invalid combinations such as success with a non-null error.
- Aborting on unmount and before retry directly addresses the spec's late-response and repeated-retry edge cases.

**Alternatives considered**:
- Separate `isLoading`, `data`, and `error` booleans: rejected because they permit contradictory combinations.
- Add React Query/SWR: rejected because no data-fetching library is installed and a single-section request does not justify a new runtime dependency.
- One automatic retry: deferred; manual retry is required, and automatic retry would complicate the state semantics without a product requirement.

## Decision 8: API client extension

**Decision**: Extend `api.get` to accept `RequestInit`-based options, including `signal`. Keep the existing request function, base URL resolution, header handling, JSON serialization, 204 handling, and error normalization. Replace touched `any` signatures with `unknown` where safe.

**Rationale**:
- The constitution requires transport behavior to live in the shared API client.
- The activity hook needs cancellation; adding an options parameter is the smallest compatible change.
- No new HTTP library is needed.

**Alternatives considered**:
- Add a separate `getWithSignal` helper: rejected because it fragments the transport surface.
- Use raw `fetch` in the service: prohibited.
- Ignore cancellation: rejected because the spec requires no visible stale updates after the visitor leaves.

## Decision 9: Login return behavior and safe redirects

**Decision**:
- Add `getDashboardPath(role)` to `src/libs/navigation.ts`, resolving the Dashboard item from `NAVIGATION_ITEMS`.
- Add `getLoginHref(returnTo?: string)` and a same-origin redirect validator in the same shared module.
- Make `app/(public)/login/page.tsx` an async Server Component that reads the Next.js `searchParams` promise, then pass `redirectTo` to `LoginForm` as a prop.
- Update `LoginForm` to sanitize the prop (including rejecting `/login` to avoid a post-login loop) and navigate to the safe value or the role dashboard after successful login. This avoids a client `useSearchParams` dependency and a Suspense requirement that would also affect the existing scratch page rendering `LoginForm`.

**Rationale**:
- FR-007 requires returning to the originating landing section, including Services.
- Hardcoded dashboard paths already exist in `LoginForm`; centralizing them removes duplication.
- Sanitizing `redirectTo` prevents open redirects and protocol-relative URL attacks.
- Using the shared `navigation` module avoids a landing-specific auth convention.

**Alternatives considered**:
- Store the return target in `sessionStorage`: rejected because it is invisible, harder to test, and fails when login opens in a new tab.
- Let the proxy handle return behavior: rejected because the proxy currently handles protected-route authorization, not a sanitized post-login destination.
- Hardcode `/login?redirectTo=...` strings in every component: rejected; one helper keeps encoding and validation consistent.

## Decision 10: Guest/auth-state QA for the existing mock auth

**Decision**: Keep the landing feature's auth dependency to `useAuth()`. Add the minimal `AuthProvider` fix that includes `isLoading` and `refreshUser` in the context `useMemo` dependencies so auth-loading changes reach consumers. Add an optional mock-only scenario to `mock.auth.service.ts` controlled by `NEXT_PUBLIC_MOCK_AUTH_STATE=guest|student|manager|admin` (default `student` to preserve current behavior). In `guest`, `getMe()` rejects with a normalized unauthenticated error; `AuthProvider` already clears the user on rejection.

**Rationale**:
- The current mock auth always authenticates a test student, so guest-only presentation cannot be manually verified in the running app.
- This is a deterministic fixture capability, not a second production service-selection mechanism.
- It avoids a broad auth refactor while allowing manual QA of the locked services, header Log In, and Get Started flow.

**Alternatives considered**:
- Refactor `AuthProvider` to a full auth-service interface and selection point now: deferred; out of scope for the landing feature.
- Add a visible dev-only guest toggle: rejected because it would add product UI not in the spec.
- Rely only on component tests for guest state: insufficient for visual and assistive-technology verification; keep as fallback if maintainers reject the mock-only change.

**Risk note**: If this mock change is rejected, manual guest-state verification must wait for the real backend, and the component tests remain the primary guest-state coverage.

## Decision 11: Design tokens and typography

**Decision**: Add the landing tokens to `src/app/globals.css` through the Tailwind v4 `@theme` layer. Wire the existing Geist import in `app/layout.tsx` (it is imported but not instantiated today) and map body typography to the font token instead of the current Arial fallback. Do not add a font package. The current automatic dark-mode background override is not part of the landing design; remove or neutralize it for the landing surface, and do not implement a dark theme.

**Rationale**:
- The constitution prohibits hardcoded colors and requires a token layer.
- Tailwind v4's `@theme` layer exposes tokens as utilities and CSS variables.
- The project already loads Geist; reusing it avoids a new dependency and network risk.

**Alternatives considered**:
- Add Inter/Poppins as a new font: deferred until visual comparison confirms Geist is insufficient; the source design's font is an assumption.
- Use arbitrary hex values in components: prohibited.
- Add a separate CSS file for landing tokens: rejected because the constitution names `globals.css` as the token source.

## Decision 12: Images and Next.js 16 APIs

**Decision**:
- Use local assets under `public/images/landing/`.
- Use `next/image` with `preload` for the hero (Next.js 16; `priority` is deprecated) and `sizes="100vw"`.
- Lazy-load below-the-fold images.
- Use an `onError` wrapper for the hero and activity images to render fallbacks while preserving dimensions.
- Do not add `images.remotePatterns` until the real media host is confirmed.

**Rationale**:
- The spec requires the hero early, below-the-fold images not to delay first presentation, and image failures to preserve layout.
- The AGENTS.md warning requires reading the installed Next.js 16 docs; `preload` is the current API.
- A broad remote allowlist would be a security and maintenance problem; the backend host is unknown.

**Alternatives considered**:
- Use CSS background images for the hero: rejected for the primary visual because `next/image` provides responsive optimization and explicit sizing; CSS background can remain as the fallback color layer.
- Set a permissive remote pattern: rejected.
- Use unoptimized remote images: rejected; it bypasses the framework's image handling and still needs host policy.

## Decision 13: Formatting dates and times

**Decision**: Implement `formatActivityTime(start, end)` in `src/libs/format.ts` using `Intl.DateTimeFormat` with `timeZone: "Asia/Ho_Chi_Minh"` and `formatToParts` to produce the exact required shape:

- Same day: `dd/MM/yyyy, H:mm - H:mm`
- Multi-day: `dd/MM/yyyy H:mm - dd/MM/yyyy H:mm`
- 24-hour clock, non-padded hour, two-digit minutes.

Invalid dates are rejected by the mapper and never reach the formatter.

**Rationale**:
- The spec fixes the timezone and examples.
- `Intl` is built in and timezone-aware.
- `formatToParts` avoids locale-specific ordering and leading-zero differences.
- The mapper is the correct place to reject unreadable dates, keeping the formatter total for valid input.

**Alternatives considered**:
- `toLocaleString` with a fixed locale: rejected because output details vary by runtime.
- A date library: rejected as an unnecessary runtime dependency.
- Format in the component: rejected; formatting is shared logic and must be testable.

## Decision 14: Navigation, scroll-spy, and history

**Decision**:
- `scrollToSection(id)` updates the hash with `history.pushState`, scrolls the target into view with a header offset, and uses `behavior: "auto"` when reduced motion is requested.
- `useScrollSpy(ids)` uses `IntersectionObserver` with a header-aware margin.
- The active link uses `aria-current="location"` plus an underline/weight cue.
- A `hashchange`/`popstate` listener restores the matching section for back/forward and direct hashes.

**Rationale**:
- FR-010/FR-012 require smooth, offset scrolling and history restoration.
- `IntersectionObserver` avoids scroll-event performance issues.
- A non-color cue is required by FR-011 and accessibility rules.
- Reduced-motion support is required by FR-067.

**Alternatives considered**:
- Use `next/link` with hash hrefs only: rejected because the floating header offset and history control need explicit handling.
- Use scroll events: rejected for performance and jitter.
- Use `aria-current="page"` for section links: rejected; `aria-current="location"` better describes a location within the page.

## Decision 15: Mobile menu implementation

**Decision**: Use a native modal `<dialog>` for the narrow-screen menu. Call `showModal()` when opened, style the top-sheet panel and `::backdrop`, lock body scrolling, close on Escape or backdrop activation, and restore focus to the trigger. Selecting a link closes the menu before scrolling.

**Rationale**:
- Native `<dialog>` provides modal semantics, focus containment, and Escape handling without a custom focus-trap implementation.
- It satisfies the clarification for a modal drawer with trapped focus and excluded background content.
- Semantic HTML is preferred over ARIA-heavy custom widgets.

**Alternatives considered**:
- A custom `div` with `role="dialog"` and a hand-written focus trap: rejected as more code and more failure modes.
- An inline disclosure: rejected by the clarified requirement.
- A third-party drawer library: rejected; no runtime dependency is justified.

## Decision 16: Activity layout rules

**Decision**: Implement the four layout outcomes in `ActivityGrid`:

1. Featured and upcoming exist: featured area on the left (up to 2 cards), compact stack on the right (up to 3 cards).
2. Featured only: featured cards span the available width; one card uses one full-width column, two cards use two columns.
3. Upcoming only: render upcoming in the featured card style in a responsive grid of up to 5 cards and at most 3 columns.
4. Neither: never render a grid; use the empty state.

Responsive behavior:
- Below `sm`: one column; compact cards keep their horizontal form.
- `sm` to `lg - 1`: featured cards use two columns; compact cards form a two-column stack below.
- `lg` and above: the designed two-featured-plus-three-compact arrangement.

**Rationale**:
- Directly implements FR-024 through FR-028 and FR-058 through FR-060.
- Handles the single-list case without inferring featured status.
- Avoids empty columns and clipping during reflow.

**Alternatives considered**:
- Always use a fixed 2+3 grid: rejected because it leaves empty columns and violates the specified outcomes.
- Infer featured items from order: prohibited by the clarification.
- Render all items and rely on overflow: rejected because it violates the no-clipping and no-horizontal-scroll requirements.

## Decision 17: Services gating presentation

**Decision**:
- Treat `isLoading` as locked.
- Guest: public services are real links; authenticated-only services render as non-link, inert, `aria-hidden` cards with a blur and no destination.
- Authenticated: all services are real links.
- No overlay invitation is rendered over locked cards.
- External links use `target="_blank"` and `rel="noopener noreferrer"`.

**Rationale**:
- Satisfies FR-041 through FR-049 and the clarification that the header Log In action is the only sign-in path.
- Not rendering an `<a>` for locked cards guarantees no destination, keyboard access, or selection.
- Keeping the same outer structure prevents layout shift on unlock.

**Alternatives considered**:
- Render links with `pointer-events: none`: rejected because the destination remains in the DOM and may be reachable by keyboard or assistive technology.
- Add the optional overlay: rejected by the clarification.
- Hide locked cards entirely: rejected because the design requires the obscured presentation.

## Decision 18: Content configuration and deferred copy

**Decision**: Centralize navigation, hero copy/actions, shared section headers, highlights, services, guides, footer, and SEO values in `features/landing/config/*.ts`. Centralize the activity section header, status labels, and empty/error messages in `features/activities/config.ts`. Represent unavailable guide destinations explicitly and render those cards as unavailable and non-interactive until a destination is confirmed. Do not invent the two unnamed services.

**Rationale**:
- FR-072 requires a single configurable source.
- The spec's open questions are release dependencies; the layout must remain usable without them.
- An explicit unavailable state avoids dead links (FR-053).

**Alternatives considered**:
- Inline copy in components: rejected; it violates FR-072 and makes pending copy harder to update.
- Hide incomplete sections: rejected; the page structure and layout are still required.
- Invent placeholder service names: prohibited.

## Decision 19: Testing tooling and scope

**Decision**: Add Vitest, React Testing Library, jsdom, `vite-tsconfig-paths`, and `axe-core` as dev-only dependencies. Colocate tests with modules; keep shared setup in `tests/`. Test pure mappers/formatters, the activity hook, activity layout/cards, services gating, header actions/mobile behavior, guide availability, and focused UI primitives. Use `npm run lint` and `npm run build` as mandatory gates. Do not add Playwright now.

**Rationale**:
- No test runner exists, and the feature has stateful logic and accessibility requirements that need automated coverage.
- Dev-only dependencies do not affect the runtime bundle.
- Next.js Server Components are not directly supported by Vitest; testing client components and pure logic is the practical boundary.
- Playwright would add significant CI/browser scope and is not required to deliver this page.

**Alternatives considered**:
- Jest: rejected because the Next.js 16 docs recommend Vitest for this setup and the project has no existing Jest configuration.
- No automated tests: rejected by the constitution's quality gates and the spec's success criteria.
- Add Playwright now: deferred; quickstart covers manual browser verification.

## Decision 20: Open assumptions and release dependencies

The following remain unresolved and must not be treated as confirmed:

1. The activity endpoint, envelope, field names, and grouped/single-list representation.
2. The media host for real activity images.
3. The two remaining service names and icons.
4. Hero headline wording ("Grown." versus "Grow.").
5. Help destinations and whether `/help` exists at release.
6. Final footer copy, contact details, and hotlines.
7. Whether the activity detail page is publicly viewable and whether registration requires sign-in.

The implementation uses documented defaults and configurable seams for each. None of these blocks planning, but they must be resolved before the corresponding content is published or the real service is enabled.
