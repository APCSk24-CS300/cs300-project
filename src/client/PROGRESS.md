# PROGRESS — Public Landing Page

Last updated: 2026-11-13  
Branch: `fix/frontend/refine-homepage`  
Client root: `src/client`  
Feature: `specs/001-landing-page`  
Working tree: intentionally uncommitted; no commit was created.

## Current Task and Overall Objective

Implement the myHCMUS public Landing Page at `/` from:
- `specs/001-landing-page/spec.md`
- `specs/001-landing-page/plan.md`
- `specs/001-landing-page/tasks.md`
- `.specify/memory/constitution.md`
- `docs/ui/landing-page-ui.png`

The feature is frontend-only. Mock activity/auth modes are the default. No backend, API-route, or proxy behavior was changed.

All implementation and verification tasks in `tasks.md` are complete (`112/112`). The only remaining work is release-level product/config content that cannot be resolved from the repository.

## Completed Work

### Foundation
- Added Vitest tooling and scripts in `package.json`.
- Added `vitest.config.ts`, `tests/setup.ts`, and `tests/test-utils.tsx`.
- Added shared `SectionId`, `NavigationLink`, and `FooterContent` types.
- Removed the Node-only `http` import from `api-client.ts`; `api.get` now forwards `RequestInit` options including `AbortSignal`.
- Added landing design tokens and light-only base styling in `globals.css`.
- Wired the existing Geist fonts and removed the stale unused `Metadata` import.
- Implemented `formatActivityTime` with `Asia/Ho_Chi_Minh` formatting.
- Implemented `getDashboardPath`, `getLoginHref`, and `isSafeRedirectPath`.
- Added `service-mode.ts`.
- Fixed stale `AuthProvider` memoization and removed unused imports.
- Added mock auth QA scenarios: `guest | student | organizer | admin`, defaulting to `student`.
- Added local landing images and four local service icons.

### Shared UI and Chrome
- Added Button, Container, Section, SectionHeader, Badge, Tag, Skeleton, EmptyState, ErrorState, and SurfaceCard.
- Added ArrowRight, Calendar, Location, Lock, Menu, and Close icons.
- Added Logo, CopyrightYear, SiteHeader, and SiteFooter.
- Removed the unused `SectionHeaderSpacer`; section spacing is now handled by section wrappers.

### Landing and Activities
- Added all landing config modules: nav, sections, hero, highlights, guides, footer, services, and SEO.
- Centralized remaining user-facing copy in config: service access/external-link/unavailable labels and the guide unavailable label.
- Added Hero, Highlights, Services, Help, and Footer composition.
- Added the public route at `src/app/(public)/page.tsx`.
- Added `src/features/landing/metadata.ts` as the public metadata entrypoint so the route does not import feature internals.
- Removed the conflicting old `src/app/page.tsx`.
- Implemented activity DTO/domain types, mapper, fixtures, real/mock services, factory, and hook.
- Implemented activity skeleton, cards, status badge, metadata, image fallback, grid, and section state machine.
- Fixed `ActivityGrid` so a single featured-only card spans the full grid width.
- Implemented mock scenarios: `success`, `partial`, `empty`, `error`, `delay`, `single-list`, `all-invalid`, `long-content`.
- Implemented service gating for guest/loading/authenticated states.
- Implemented scroll-spy, hash restoration, header-aware scrolling, mobile modal drawer, and brand-to-top behavior.
- `SiteHeader` now derives scroll-spy IDs from its `links` prop instead of importing landing config, preserving feature boundaries.
- Implemented `LoginForm` redirect handling and async login-route `searchParams`.

### Test Coverage Added
- `tests/fixtures.ts` with typed activity, DTO, landing payload, session-user, and auth-context factories using numeric IDs.
- `renderWithAuth` and `expectNoA11yViolations` helpers in `tests/test-utils.tsx`.
- `tests/setup.ts` now provides a plain `matchMedia` implementation (safe under `restoreMocks`) and a native `close` event when closing dialogs.
- Landing tests: `HeroActions`, `GuideCard`, `ServiceCard`, `ServicesSection`, `LandingPage`, and axe accessibility checks.
- Activity tests: mapper, real/mock service, hook, section, card, and grid.
- Chrome/scroll tests: `SiteHeader` desktop/auth/loading/dialog behavior, scroll helpers, and return-path handling.
- Auth tests: `LoginForm` safe/unsafe redirect handling, role dashboard resolution, and failure alert behavior.
- Full-page integration test verifies the six section IDs in order, one `h1`, landmarks, and guest header state.

### Browser, Accessibility, and Visual Verification
- Captured full-page Chrome screenshots at 320, 375, 640, 768, 1024, 1440, and 1920 pixels through the DevTools Protocol.
- Confirmed no horizontal overflow at any tested width (`scrollWidth === innerWidth` at all seven widths).
- Confirmed the 320–1023 responsive columns, stacked hero actions below 640, tablet activity reflow, compact horizontal cards, and single-column narrow layout.
- Confirmed logical desktop tab order from the skip link through header navigation, hero actions, and activity links.
- Confirmed the mobile drawer opens with focus on Close, contains focus through all drawer controls, closes on Escape, and restores focus to the menu trigger.
- Ran `axe-core` in real Chrome at 375 and 1440 pixels: zero violations after fixes. Remaining `color-contrast` items are `incomplete` because text sits over images or gradients, all of which were checked against their lightest backgrounds.
- Fixed status-text contrast by darkening success to `#15803d` and warning to `#b45309`.
- Fixed muted/neutral text contrast by darkening `text-muted` and `neutral-status` to `#5b6472`.
- Removed the 75% fade from unavailable guide cards so text remains readable and matches the reference.
- Added `accent-gold-strong` (`#a16207`) for the hero headline, which is large text over a pale image and now clears AA contrast.
- Hid the large Help decoration below the `md` breakpoint so it no longer overlaps headings at 320–640 pixels.
- Allowed the hero headline to stay on one line at `lg` and above, matching the desktop reference.
- Verified reduced motion in Chrome: `scroll-behavior` becomes `auto`, transitions collapse to `1e-05s`, and translation is `none`; added a global reduced-motion `translate: none !important` override because Tailwind hover lifts use the `translate` property.
- Compared the rendered page with `docs/ui/landing-page-ui.png` and corrected the hero headline width, Help decoration overlap, guide-card fade, and contrast tokens.
- Verified the guest build: header Log In resolves to `/login?redirectTo=%2F`; hero Get Started resolves to `/login`; five main content sections plus footer render; activity grouping is 2 featured + 3 compact.
- Verified signed-in builds: student, organizer, and admin all keep the header `Log In` action; hero `Get Started` still points at the correct role dashboard.
- Reworked HCMUS Services to six display-only cards (adding placeholder `HCMUS Library` and `IT Support`), all inert with no hrefs, behind a translucent gradient/blur overlay with a `Log in for more` CTA. Chrome checks at 1440 and 375 show 3x2 and 1x6 layouts, six inert cards, zero card links, full overlay coverage, and no horizontal overflow.
- Verified all eight activity scenarios in Chrome: `success` (2+3), `partial` (1+3), `empty`, `error`, `delay` (skeleton then success), `single-list` (5 featured-only), `all-invalid` (error, no broken cards), and `long-content` (2+3, clamp, multi-day dates, image fallback). No scenario produced horizontal overflow; repeated `Try again` kept a single error node and moved focus to the section heading.
- Verified navigation and drawer behavior: direct `/#services` scroll restores with the header offset and active nav; activities → help → Back → Forward restores hashes; brand returns to `#home`; selecting a drawer link closes the dialog, scrolls to the section, and focuses it.
- Verified resilience and quickstart extras: metadata title/description/OG/Twitter tags render; one `h1`; copyright year is current; hero image failure renders the gradient fallback with text intact; activity image request failure swaps to the local placeholder; throttled conditions show the skeleton then 5 cards; no horizontal overflow.
- Restored the final build to the default `student` + `success` configuration; `npm run build` passes. Temporary QA builds were not kept.

## Files Created or Modified

### Created
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/test-utils.tsx`
- `tests/fixtures.ts`
- `src/libs/cn.ts`
- `src/libs/format.ts`
- `src/libs/format.test.ts`
- `src/libs/navigation.test.ts`
- `src/libs/api-client.test.ts`
- `src/libs/scroll.ts`
- `src/libs/scroll.test.ts`
- `src/libs/service-mode.ts`
- `src/types/navigation.ts`
- `src/types/site.ts`
- `src/app/(public)/page.tsx`
- `src/components/forms/LoginForm.test.tsx`
- `src/components/icons/ArrowRightIcon.tsx`
- `src/components/icons/CalendarIcon.tsx`
- `src/components/icons/CloseIcon.tsx`
- `src/components/icons/LocationIcon.tsx`
- `src/components/icons/LockIcon.tsx`
- `src/components/icons/MenuIcon.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Button.test.tsx`
- `src/components/ui/Container.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/ErrorState.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/SectionHeader.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/SurfaceCard.tsx`
- `src/components/ui/Tag.tsx`
- `src/components/layout/CopyrightYear.tsx`
- `src/components/layout/Logo.tsx`
- `src/components/layout/SiteFooter.tsx`
- `src/components/layout/SiteHeader.tsx`
- `src/components/layout/SiteHeader.test.tsx`
- `src/features/landing/index.ts`
- `src/features/landing/metadata.ts`
- `src/features/landing/components/LandingPage.tsx`
- `src/features/landing/components/LandingPage.test.tsx`
- `src/features/landing/components/HeroSection.tsx`
- `src/features/landing/components/HeroVisual.tsx`
- `src/features/landing/components/HeroActions.tsx`
- `src/features/landing/components/HeroActions.test.tsx`
- `src/features/landing/components/HighlightsSection.tsx`
- `src/features/landing/components/FeatureCard.tsx`
- `src/features/landing/components/ServicesSection.tsx`
- `src/features/landing/components/ServicesSection.test.tsx`
- `src/features/landing/components/ServiceCard.tsx`
- `src/features/landing/components/ServiceCard.test.tsx`
- `src/features/landing/components/HelpSection.tsx`
- `src/features/landing/components/GuideCard.tsx`
- `src/features/landing/components/GuideCard.test.tsx`
- `src/features/landing/components/landing-accessibility.test.tsx`
- `src/features/landing/config/nav.ts`
- `src/features/landing/config/sections.ts`
- `src/features/landing/config/hero.ts`
- `src/features/landing/config/highlights.ts`
- `src/features/landing/config/guides.ts`
- `src/features/landing/config/footer.ts`
- `src/features/landing/config/services.ts`
- `src/features/landing/config/seo.ts`
- `src/features/activities/index.ts`
- `src/features/activities/config.ts`
- `src/features/activities/types/activity.dto.ts`
- `src/features/activities/types/activity.ts`
- `src/features/activities/types/index.ts`
- `src/features/activities/mappers/activity.mapper.ts`
- `src/features/activities/mappers/activity.mapper.test.ts`
- `src/features/activities/mappers/index.ts`
- `src/features/activities/services/activity.fixtures.ts`
- `src/features/activities/services/activity.service.ts`
- `src/features/activities/services/activity.service.test.ts`
- `src/features/activities/services/mock.activity.service.ts`
- `src/features/activities/services/activity.service.factory.ts`
- `src/features/activities/hooks/useLandingActivities.ts`
- `src/features/activities/hooks/useLandingActivities.test.tsx`
- `src/features/activities/components/ActivitiesSection.tsx`
- `src/features/activities/components/ActivitiesSection.test.tsx`
- `src/features/activities/components/ActivitiesSkeleton.tsx`
- `src/features/activities/components/ActivityCard.tsx`
- `src/features/activities/components/ActivityCard.test.tsx`
- `src/features/activities/components/ActivityGrid.tsx`
- `src/features/activities/components/ActivityGrid.test.tsx`
- `src/features/activities/components/ActivityImage.tsx`
- `src/features/activities/components/ActivityMeta.tsx`
- `src/features/activities/components/ActivityStatusBadge.tsx`
- `public/images/landing/hero.png`
- `public/images/landing/highlight-activities.png`
- `public/images/landing/highlight-journey.png`
- `public/images/landing/highlight-campus.png`
- `public/images/landing/activity-placeholder.png`
- `public/images/services/moodle.png`
- `public/images/services/tuition.png`
- `public/images/services/portal.png`
- `public/images/services/website.png`
- `public/images/services/library.svg`
- `public/images/services/support.svg`

### Modified
- `package.json`
- `package-lock.json`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(public)/login/page.tsx`
- `src/components/forms/LoginForm.tsx`
- `src/features/auth/context/AuthContext.tsx`
- `src/features/auth/provider/AuthProvider.tsx`
- `src/features/auth/services/mock.auth.service.ts`
- `src/libs/api-client.ts`
- `src/libs/navigation.ts`
- `specs/001-landing-page/tasks.md` (checkboxes updated for verified work only)

### Deleted
- `src/app/page.tsx` (replaced by `src/app/(public)/page.tsx`)

## Current Implementation Status

### Verified
- `npx tsc --noEmit` passes.
- `npm run lint` passes with `0` errors and `2` pre-existing unrelated warnings (`proxy.ts` unused `ROLE_CODES`; student dashboard unused `user`).
- `npm test` passes: **19 files / 109 tests**.
- `npm run build` passes. `/` is statically generated; `/login` is dynamic.
- No remote Unsplash URLs remain in `src`.
- The mock activity service is imported only by its factory in production code.
- The old root route was removed; `/` resolves through `(public)/page.tsx`.
- No cross-feature internal imports remain in production code.
- Axe unit checks pass for header/footer, services guest/auth, and activities success/empty/error.
- Axe in real Chrome reports zero violations at 375 and 1440 pixels.
- Responsive behavior is verified at 320, 375, 640, 768, 1024, 1440, and 1920 pixels with no horizontal scrolling.
- Desktop tab order and mobile-drawer focus containment/restoration are verified in Chrome.
- Reduced motion is verified in Chrome for scroll behavior, transitions, and hover translation.
- The rendered page has been reviewed against `docs/ui/landing-page-ui.png`; visual mismatches were fixed.
- Guest, student, organizer, and admin role journeys are verified in Chrome.
- All eight activity scenarios, repeated retry, single-list reflow, image failure, and throttled loading are verified in Chrome.
- Direct hashes, Back/Forward, brand-to-top, drawer section selection, focus restoration, and backdrop/Escape closure are verified in Chrome.
- `tasks.md` has 112 of 112 tasks checked.

### Release dependencies not verifiable from the repository
- Confirmed service names/icons/destinations (two cards are placeholders), guide destinations, activity detail route, hero/footer copy, and production metadata URL remain product/content decisions.
- A physical screen-reader pass was not performed; semantics, headings, landmarks, keyboard behavior, focus containment, and axe checks are verified.

## Task Status Summary

### Complete (verified)
- T001–T049: foundation, primitives, icons, logo, copyright, landing components, public route.
- T050: US1 guest journey in Chrome, including six sections, 2+3 cards, guest Log In, Get Started, Explore, and activity links.
- T051–T067: activity mapper/service/hook/grid/card/state tests and implementation.
- T068: US2 eight-scenario activity matrix, repeated retry, single-list reflow, and clipping/overflow checks.
- T069–T075: services/role tests and implementation.
- T076: all six service cards are display-only and inert behind the login overlay; no service destination is keyboard/pointer/AT reachable.
- T077–T082: signed-in role tests and implementation.
- T083: student/organizer/admin role flows verified against role builds; header remains login-only and hero Get Started uses the role dashboard.
- T084–T093: scroll, mobile drawer, redirect, and integration tests/implementation.
- T094: direct hashes, Back/Forward, brand-to-top, drawer selection, Escape/backdrop, and focus restoration.
- T095–T105: boundary, metadata, copy, asset, login return-flow, composition, scope, lint, build, and test gates.
- T106: responsive verification at all seven target widths with no horizontal overflow.
- T107: keyboard/AT review with browser tab order, drawer focus containment, semantic checks, and locked-service tests.
- T108: automated axe checks in jsdom and real Chrome.
- T109: contrast review and fixes; zero real-browser axe violations.
- T110: reduced-motion review and fixes in Chrome.
- T111: full quickstart matrix, including image failure, throttled loading, repeated retry, reflow, hashes, drawer, and all auth roles.
- T112: visual review against `docs/ui/landing-page-ui.png` with fixes.

## Known Issues, Risks, and Blockers

1. **Build warning:** `metadataBase` is not set, so Next resolves OpenGraph images against `http://localhost:3000`. Set a production site URL or `metadataBase` before release.
2. **Lint warnings remain in pre-existing unrelated files:** unused `ROLE_CODES` in `proxy.ts` and unused `user` in the student dashboard page. No new lint errors remain.
3. **Service destinations are assumptions.** `Tuition Payment` points to the HCMUS root and `HCMUS Website` points to the HCMUS root; confirm final URLs before release.
4. **Six service cards are configured, including two placeholders.** `HCMUS Library` and `IT Support` are display-only placeholders. Per a later user request, all six cards are intentionally inert behind a gradient/blur-login overlay, so service URLs are not currently reachable; confirm names/icons/URLs if the cards become active.
5. **Guide destinations are unavailable.** All four guide cards render as non-interactive “Coming soon” cards until `/help` destinations are confirmed.
6. **Activity detail route does not exist yet.** Activity cards link to `/activities/{id}`; this route is a release dependency.
7. **Activity API contract is provisional.** Mock mode is the default; `NEXT_PUBLIC_DATA_SOURCE=api` should not be enabled until the endpoint, envelope, fields, and image host are confirmed.
8. **Hero copy remains pending.** The design text `Grown.` is preserved as one constant; confirm whether it should be `Grow.`.
9. **Footer copy is provisional.** Address/phone/email use public HCMUS-style placeholder content and must be confirmed.
10. **Physical screen-reader pass not performed.** Keyboard focus, drawer containment, landmarks, headings, and automated axe checks are verified; a manual screen-reader pass is still recommended before release.
11. **`metadataBase` and env naming:** `.env.local` currently uses `NEXT_PUBLIC_API_URL`, while the API client reads `NEXT_PUBLIC_API_BASE_URL`. Real API mode requires correcting local env configuration.
12. **Header auth action is intentionally login-only.** Per a later user request, `SiteHeader` always shows `Log In` and never exposes a Dashboard link, even when authenticated. This deviates from FR-008/spec language that expects a header Dashboard action; authenticated users still reach their dashboards through hero `Get Started`, login success, or direct routes.
13. **Services are intentionally display-only.** The six cards are hidden from assistive technology and pointer/keyboard interaction, with a shared `Log in for more` overlay. This intentionally replaces the earlier public/authenticated service-link behavior.
14. **No commit was created.** All changes remain in the working tree.

## Remaining Work and Recommended Next Steps

All tasks in `tasks.md` are complete. Remaining work is release configuration and product content:

1. Resolve release dependencies: activity detail route, confirmed service names/icons (or replacement of the two placeholders), guide destinations, hero/footer copy, and production metadata URL.
2. Set `metadataBase` to the production origin and reconcile `NEXT_PUBLIC_API_URL` with `NEXT_PUBLIC_API_BASE_URL` before enabling real API mode.
3. Optionally run a physical screen-reader smoke test; automated accessibility, keyboard, focus, and responsive checks already pass.
4. Re-run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` after resolving the content/config dependencies.

## Commands to Resume

```powershell
cd src/client
npm install
npm run dev
npm test
npm run test:watch
npm run lint
npx tsc --noEmit
npm run build
```

## Environment Used for QA

```dotenv
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO=success
NEXT_PUBLIC_MOCK_AUTH_STATE=student
```

Use `guest` for guest-state QA and `organizer`/`admin` for role continuity.
