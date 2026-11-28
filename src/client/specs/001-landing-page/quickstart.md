# Quickstart: Public Landing Page

**Feature**: `001-landing-page` | **Date**: 2026-11-13

This guide is for implementation and verification of the landing page. It assumes the feature plan has been implemented. It does not replace the specification or the contracts.

## Prerequisites

- Node.js compatible with the project's Next.js 16 setup.
- Dependencies installed from the repository root of the client app.
- Read `AGENTS.md` before changing Next.js code. This project uses Next.js 16 conventions (`proxy.ts`, `preload` instead of `priority`).
- Do not commit secrets or a real backend URL in `.env.local`.

## Install and Run

From `src/client`:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality gates:

```powershell
npm run lint
npm run build
npm test
```

`npm test` is available after the test-tooling task adds Vitest and the test scripts. Until then, use `npm run lint` and `npm run build`, and run the manual checks below.

## Mock Configuration

Create an untracked `.env.local` for local verification:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO=success
NEXT_PUBLIC_MOCK_AUTH_STATE=student
```

| Variable | Values | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` (default), `api` | Selects the activity service implementation |
| `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO` | `success`, `partial`, `empty`, `error`, `delay`, `single-list`, `all-invalid`, `long-content` | Selects deterministic activity fixtures |
| `NEXT_PUBLIC_MOCK_AUTH_STATE` | `guest`, `student`, `manager`, `admin` | Optional mock-auth QA scenario; default preserves the existing signed-in mock behavior |

`NEXT_PUBLIC_*` values are embedded at build time. Restart the dev server after changing them.

### Real service configuration

When the backend contract is confirmed:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=https://your-confirmed-api.example
```

Do not enable this until the endpoint, response envelope, field names, and image host are confirmed. If activity images are remote, add the confirmed host to `images.remotePatterns`; do not use a broad allowlist.

## Verification Matrix

### 1. Static page and composition

1. Open `/` with activities in `delay` mode.
2. Confirm the header, hero, highlights, help, and footer render before the activity request completes.
3. Confirm there is exactly one `h1`, section titles are `h2`, and card titles are `h3`.
4. Confirm the six sections appear in order: Hero, Highlights, Activities, Services, Help, Footer.
5. Confirm the page metadata title, description, and social preview are present.
6. Confirm the footer copyright year matches the current year and is not a hardcoded value.

### 2. Guest behavior

1. Set `NEXT_PUBLIC_MOCK_AUTH_STATE=guest`.
2. Confirm the header shows Log In and reserves its space without a Dashboard flash.
3. Confirm Get Started opens `/login` and, after successful sign-in, lands on the role dashboard.
4. Confirm header Log In from the services area returns to `/#services` after sign-in.
5. Confirm public services are usable and authenticated-only services are blurred, inert, unselectable, and absent from the accessibility tree.
6. Confirm there is no “Log in to see all services” overlay.

### 3. Signed-in behavior

1. Set the mock auth state to `student`, then repeat for `manager` and `admin`.
2. Confirm `/` does not redirect away.
3. Confirm the header shows Dashboard and links to the correct role dashboard.
4. Confirm all services are visible and usable.
5. Confirm Get Started goes directly to the role dashboard.

### 4. Activity states

Use the mock scenario variable and reload `/` for each case:

| Scenario | Expected |
|----------|----------|
| `success` | Two featured cards on the left and three compact cards on the right on wide screens |
| `partial` | Invalid records are omitted; valid records still render |
| `empty` | Empty message with reserved height; no empty grid |
| `error` | Error message and Try again; the rest of the page remains usable |
| `delay` | Skeleton persists; header and other sections remain usable |
| `single-list` | Up to five featured-style cards, at most three columns |
| `all-invalid` | Error outcome; no broken cards |
| `long-content` | Four-line featured title clamp, three-line compact clamp, multi-day date, missing optional fields omitted, image fallback |

Retry:

1. Start in `error`.
2. Activate Try again repeatedly.
3. Confirm the section enters loading and ends in exactly one success, empty, or error outcome with no duplicate content.

### 5. Navigation

1. Click each header link; confirm the section lands below the floating header and the URL hash updates.
2. Scroll through the page; confirm the active link updates and uses more than color.
3. Open `/#services` directly; confirm the services section is positioned correctly after images/fonts finish loading.
4. Use browser Back and Forward; confirm the previous/next section is restored.
5. Open the brand; confirm it returns to the top.

### 6. Mobile drawer

Use a viewport below 1024px:

1. Open the menu; confirm it is modal, contains all section links and the auth action, and locks page scrolling.
2. Press Tab repeatedly; confirm focus stays inside the drawer.
3. Press Escape; confirm the drawer closes and focus returns to the menu trigger.
4. Activate the backdrop; confirm the drawer closes and focus returns to the trigger.
5. Select a section; confirm the drawer closes and the page moves to that section.

### 7. Responsive layout

Check at 320, 375, 640, 768, 1024, 1440, and 1920 pixels wide.

- 320–639: one column for highlights, services, and guides; hero actions stack; compact activities stay horizontal.
- 640–1023: header uses the menu; highlights and services use two columns; guides use two columns; featured activities use two columns; compact activities form a two-column stack below.
- 1024+: three highlight columns; 3x2 services; 2x2 guides; featured/compact activity arrangement as designed.
- No horizontal scrolling at any width.
- Touch targets are at least 44x44px.

### 8. Accessibility

1. Navigate the entire page by keyboard; every interactive element is reachable in a logical order with visible focus.
2. Confirm the activity section announces loading/empty/error without moving focus.
3. Confirm status labels include text and are not color-only.
4. Confirm decorative images/shapes are hidden and content images have meaningful alternatives.
5. Confirm the mobile drawer excludes the rest of the page from keyboard and screen-reader navigation.
6. Enable reduced motion; confirm scrolling is immediate, hover lift is suppressed, and skeleton pulse is disabled.
7. Run `axe-core` checks (once the test helper exists) and review the report for critical violations.
8. Check text contrast at WCAG 2.1 AA, especially the hero headline over the campus image and white text on the deep-blue services/footer backgrounds.

### 9. Images and resilience

1. Force the hero image to fail; confirm the layout remains intact and the text stays readable.
2. Force an activity image to fail; confirm the branded placeholder preserves card dimensions.
3. Use an invalid image URL in a mock fixture; confirm no layout shift.
4. Throttle the network; confirm the activity skeleton does not block the rest of the page.

### 10. Activity contract edge cases

1. A single ordered list is treated as upcoming and rendered in the featured style.
2. A single list after grouped placeholders may reflow without clipping, overlap, or horizontal scrolling.
3. An activity with no categories or location omits those lines without punctuation artifacts.
4. A multi-day activity displays both dates and times in `Asia/Ho_Chi_Minh`.
5. A title with Vietnamese text renders exactly as supplied, with no case transformation.
6. Extra featured/upcoming items are ignored beyond the display caps.

## Automated Test Targets

Once the test tooling is installed:

```powershell
npm test
npm run test:watch
```

Expected coverage:

- `formatActivityTime` timezone, same-day, multi-day, midnight, and invalid input.
- `getDashboardPath`, `getLoginHref`, and safe redirect validation, including open-redirect rejection.
- `activity.mapper` grouped/single-list shapes, invalid-item skipping, all-invalid errors, caps, href encoding, and title preservation.
- Real/mock activity service contract, API path/signal use, and error propagation.
- `useLandingActivities` loading/success/empty/error, retry, abort, stale-response protection, and mapper-error handling.
- `ActivitiesSection` state rendering, retry, and announcements.
- `ActivityGrid` layout rules.
- `ActivityCard` links, clamps, optional fields, image fallback, and status text.
- `HeroActions` guest/authenticated/loading targets.
- `ServicesSection` guest/authenticated/loading gating.
- `SiteHeader` auth actions, role dashboard path, mobile dialog, and active section.
- `GuideCard` available/unavailable destinations.
- `axe-core` checks for key client renders.

## Known Limitations and Release Dependencies

- The activity endpoint, envelope, and field names are provisional. Do not enable the real service until the backend confirms them.
- The real media host is unknown; remote activity images require a confirmed image allowlist.
- Two service names/icons, final hero wording, help destinations, and footer copy are pending.
- `/help` may not exist; guide cards whose destinations are unavailable must render as unavailable, not dead links.
- The existing auth mock auto-authenticates a test student. Guest-state manual QA depends on the optional mock-auth scenario; otherwise use component tests and the real backend.
- The existing proxy has an unrelated authenticated-`/login` redirect issue; avoid expanding this feature into a proxy refactor.
- Next.js 16 uses `preload`, not `priority`, for the hero image.
- Do not add a new runtime dependency for this feature; test dependencies are dev-only and justified in the plan.
