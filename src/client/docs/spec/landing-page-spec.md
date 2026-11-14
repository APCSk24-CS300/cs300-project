# myHCMUS — Landing Page Specification

> Audience: a coding agent (and human reviewers) implementing the public landing page at route `/`.
> Source of truth for visuals: the Figma/PNG desktop design (`docs/ui/landing-page-ui.png`). Values marked **(approx.)** were estimated from the PNG and must be verified against Figma.
> Items marked **[ASSUMPTION]** are decisions made because the design/backend is silent. Items marked **[TBD]** need product input.

---

## 1. Purpose & Scope

The landing page is the public entry point of **myHCMUS**, a platform for extracurricular activities and student training scores (DRS) at HCMUS.

Goals:
1. Explain what the platform does (hero + highlights).
2. Showcase featured/upcoming activities, fetched from an API, with complete loading / empty / error handling.
3. Give quick access to university services; **guests see only part of them**, the rest is blurred to motivate login.
4. Point to help content and provide contact info (footer).

Out of scope: login form (`/login`), dashboards, the activity detail page, the full activities list page, About Us and Help pages. Only their **links** are wired from here.

---

## 2. Page Anatomy

A global header floats over the hero. The page body has **6 sections**:

| # | Section | Anchor id | Background | Data source |
|---|---------|-----------|------------|-------------|
| 0 | Site Header (global, floating) | — | white pill over hero | static nav config + auth state |
| 1 | Hero | `home` | campus photo + white gradient | static |
| 2 | Platform Highlights | `about` | white card overlapping hero | static config |
| 3 | Featured & Upcoming Activities | `activities` | page background (white/very light) | **API** |
| 4 | HCMUS Services (Quick Access) | `services` | full-bleed deep blue | static config + **auth state** |
| 5 | Help / Guide | `help` | white with decorative blue circles | static config |
| 6 | Footer | `contact` | full-bleed deep blue | static config |

Header nav items map to anchors: Home → `#home`, About Us → `#about`, Activities → `#activities`, Services → `#services`, Help → `#help`.

---

## 3. Fit with the Existing Frontend

Existing structure (Next.js App Router): `app/(public)`, `app/(protected)/{admin,organizer,student}`, `features/auth/*` (context, provider, schema, services + mock service, types, DTO), `hooks/useAuth.ts`, `libs/{api-client,navigation,roles,session}.ts`, `components/{forms,icons}`, `types/{api,entities}.ts`.

Follow the same conventions already used by `features/auth`:
- Feature-first folders under `features/<name>/`.
- **Service + mock service** pair behind one interface (see `auth.service.ts` / `mock.auth.service.ts`). Reuse whatever switching mechanism auth uses (env flag or factory) — do not invent a second one.
- **DTO vs domain type separation** (`*.dto.ts` = wire format, `*.ts` = UI model) with a mapper.
- One icon per file in `components/icons`.
- HTTP goes through `libs/api-client.ts` only; no raw `fetch` in components.
- Role → dashboard resolution uses `libs/roles.ts` / `libs/navigation.ts`. If a `getDashboardPath(role)` helper does not exist yet, add it there (do not hardcode paths in components).

### 3.1 Routing

- Landing route: **`app/(public)/page.tsx`** → renders `<LandingPage />` from `features/landing`.
- **Remove or empty the current `app/page.tsx`** — two files resolving to `/` conflict.
- `app/(public)/layout.tsx` currently serves `/login`; check what it renders. The landing page composes `SiteHeader` / `SiteFooter` itself (inside `LandingPage`) so `/login` is not affected. If more marketing pages appear later, extract a `(site)` route group with a shared layout.
- The landing page is **always accessible**, including for authenticated users (no auto-redirect to dashboard). Authenticated users get a "Dashboard" button in the header and unlocked services.

### 3.2 Rendering strategy

- `app/(public)/page.tsx` is a **Server Component** (static shell, SEO metadata).
- Interactive/stateful parts are Client Components (`"use client"`): `SiteHeader` (auth state, mobile menu, scroll-spy), `ActivitiesSection` (data fetch states), `ServicesSection` (auth gating).
- Activities are fetched **client-side** through a hook so a slow/failed API never blocks the page. [ASSUMPTION] If the project already uses React Query/SWR in `providers/provider.tsx`, use it inside the hook instead of hand-rolled state; the hook's return contract stays the same.

---

## 4. File / Folder Plan

```
app/
  (public)/
    page.tsx                          # <LandingPage /> + metadata
components/
  ui/                                 # NEW – generic, feature-agnostic primitives
    Button.tsx
    Container.tsx
    Section.tsx
    SectionHeader.tsx
    Badge.tsx                         # StatusBadge built on top
    Tag.tsx
    Skeleton.tsx
    EmptyState.tsx
    ErrorState.tsx
    SurfaceCard.tsx
  layout/                             # NEW – site chrome
    SiteHeader.tsx
    SiteFooter.tsx
    Logo.tsx
  icons/                              # existing folder, add one file per icon
    ArrowRightIcon.tsx
    CalendarIcon.tsx
    LocationIcon.tsx
    LockIcon.tsx
    MenuIcon.tsx  CloseIcon.tsx
features/
  landing/
    components/
      LandingPage.tsx                 # composes all sections
      HeroSection.tsx
      HighlightsSection.tsx
      FeatureCard.tsx
      ServicesSection.tsx
      ServiceCard.tsx
      HelpSection.tsx
      GuideCard.tsx
    config/
      nav.ts                          # header links
      highlights.ts
      services.ts
      guides.ts
      footer.ts
  activities/
    components/
      ActivitiesSection.tsx           # state machine → renders one of the below
      ActivityCard.tsx                # variant: "featured" | "compact"
      ActivityMeta.tsx                # date + location rows
      ActivityStatusBadge.tsx
      ActivityGrid.tsx                # layout rules (see 7.6)
      ActivitiesSkeleton.tsx
    hooks/
      useLandingActivities.ts
    services/
      activity.service.ts
      mock.activity.service.ts
    mappers/
      activity.mapper.ts              # DTO → Activity
    types/
      activity.dto.ts
      activity.ts
      index.ts
libs/
  format.ts                           # formatActivityTime(), etc.
  scroll.ts                           # scrollToSection(), useScrollSpy()
public/images/landing/                # hero.jpg, highlight-*.jpg, activity-placeholder.png
```

Rule of thumb: anything not tied to landing or activities semantics lives in `components/ui` or `components/layout`; anything tied to an activity lives in `features/activities`; section-specific composition lives in `features/landing`.

---

## 5. Design Tokens (approx.)

Map these into `app/globals.css` (CSS variables, or the Tailwind theme if Tailwind is in use — check `globals.css`). Never hardcode hex values in components.

| Token | Value (approx.) | Usage |
|-------|-----------------|-------|
| `--color-primary` | `#1F4FA3` | buttons, eyebrow text, links, header Log In |
| `--color-primary-dark` | `#17409A` | services & footer background |
| `--color-accent-gold` | `#F2B31B` | hero title highlight, "my" in logo |
| `--color-text` | `#111827` | headings/body |
| `--color-text-muted` | `#6B7280` | meta text, descriptions |
| `--color-success` | `#16A34A` | "Registration Open" dot/text |
| `--color-warning` | `#D97706` | "Upcoming" |
| `--color-neutral-status` | `#6B7280` | "Closed" |
| `--color-surface` | `#FFFFFF` | cards |
| `--color-guide-gradient-from/to` | `#FFFFFF → #E3EEFB` | Help cards (top→bottom) |
| `--radius-card` | `24px` (highlights card ≈ `28–32px`, activity cards ≈ `12px`) | |
| `--radius-pill` | `9999px` | header, buttons, service cards (≈ `24px` if full pill looks too round in Figma) |
| `--shadow-card` | soft, ~`0 8px 24px rgba(0,0,0,.10)` | highlights card, activity cards |

Typography: a clean geometric sans (the design looks like Inter/Poppins-style — **verify in Figma**). Eyebrows are uppercase/small in `--color-primary`; section titles are bold ~`32–40px`; card titles ~`16–18px` semibold; meta ~`11–12px`.

Layout: content container max-width ≈ `1200px`, horizontal padding `24px`; full-bleed sections (hero, services, footer) use a `Container` inside for content.

Responsive **[ASSUMPTION]** (only desktop provided): ≥1024px as designed; 640–1023px → 2 columns, header collapses into hamburger; <640px → 1 column, buttons stack full width.

---

## 6. Shared Reusable Components (contracts)

```ts
// components/ui/Button.tsx
type ButtonProps = {
  variant: "primary" | "secondary" | "white" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;            // renders next/link when present
  isLoading?: boolean;
  leftIcon?: ReactNode; rightIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

// components/ui/SectionHeader.tsx
type SectionHeaderProps = {
  eyebrow?: string;                 // "PLATFORM HIGHLIGHTS"
  title: string;
  description?: string;
  align?: "left" | "center" | "split"; // split = title left, description right (Highlights)
  tone?: "light" | "dark";          // dark = white text on blue bg (Services)
};

// components/ui/Section.tsx
type SectionProps = {
  id?: string;                       // anchor target
  background?: "none" | "primary-dark";
  children: ReactNode; className?: string;
}; // applies scroll-margin-top = header height + gap so anchors are not hidden

// components/ui/EmptyState.tsx
type EmptyStateProps = { icon?: ReactNode; title: string; description?: string; action?: ReactNode };

// components/ui/ErrorState.tsx
type ErrorStateProps = { title?: string; description?: string; onRetry?: () => void };

// components/ui/Skeleton.tsx  -> <Skeleton className="h-4 w-24" /> animated pulse block

// components/ui/Badge.tsx
type BadgeProps = { tone: "success" | "warning" | "neutral" | "info"; withDot?: boolean; children: ReactNode };

// components/ui/Tag.tsx  -> small text label (e.g., "Academic", "Science")
```

`SurfaceCard` = white rounded container with `--shadow-card`; used by Highlights wrapper, ActivityCard, GuideCard (with `gradient` prop).

---

## 7. Section Specifications

### 7.0 Site Header (global)

**UI**
- Floating white pill, horizontally centered, ≈ `24px` from top, width ≈ container width, height ≈ `56px`, soft shadow, `position: fixed/sticky`, `z-index` above hero.
- Left: `Logo` — "my" in gold serif/italic + "HCMUS" in bold primary blue. Links to `/`.
- Center: nav links `Home · About Us · Activities · Services · Help` (14px, text color, hover → primary, active → primary + semibold or underline).
- Right: **Log In** button — `Button variant="primary" size="sm"`, pill, blue, white text.
- Mobile: logo + hamburger (`MenuIcon`) → slide-down/drawer panel with the same links + auth button.

**Behavior**
- Nav items are driven by `features/landing/config/nav.ts` (`{ label, href: "#about" }`). Clicking scrolls smoothly to the anchor (`scrollToSection`) and updates the URL hash; keyboard accessible.
- **Scroll-spy** (`useScrollSpy(ids)` with `IntersectionObserver`) highlights the link of the section in view.
- On scroll > ~16px the pill may gain stronger shadow/solid background (optional polish).
- Auth-dependent right-side control (`useAuth()` → `{ user, isAuthenticated, isLoading }`):
  - `isLoading` → render a fixed-width skeleton in place of the button (no layout shift).
  - Guest → **Log In** → `/login`.
  - Authenticated → **Dashboard** button → `getDashboardPath(user.role)` (+ optional avatar/menu with Logout; reuse existing logout from `useAuth`).

### 7.1 Hero (`#home`)

**UI**
- Full-width section, min-height ≈ `540–600px` (design ≈ `540px` visible before highlights card overlaps).
- Background: campus building photo (`next/image`, `fill`, `priority`, `object-fit: cover`) with a **white gradient overlay** fading the photo into the page background on the left and bottom (gradient from `rgba(255,255,255,.9)` at left/bottom to transparent at right/top). Mist-like soft edge at the bottom.
- Content block left-aligned, top offset ≈ `140px` from page top, max-width ≈ `560px`:
  - **Headline** (≈ `48px`, extra bold): "Discover. Participate. Grown." — gold text with subtle dark text-shadow for contrast over the photo. [TBD] "Grown." is probably meant to be "Grow."; keep the copy in a constant so it is a one-line change.
  - **Subtitle** (≈ `18px`, regular, dark text): "A platform for the extracurricular activities and student training scores." (wraps in 2 lines).
  - **CTA row** (gap ≈ `12px`):
    - `Get Started` — `Button variant="white" size="lg"`, pill, primary-blue bold text, soft shadow.
    - `Explore the activities` — `Button variant="primary" size="lg"`, pill. (Design typo "activites" → use **"activities"**.)

**Behavior / flow**
- `Get Started`: guest → `/login`; authenticated → their dashboard.
- `Explore the activities`: smooth-scroll to `#activities` (switch to `/activities` once that page exists — keep the target in config).
- Hero image failure must not break layout (background color fallback `--color-primary-dark` at low opacity).

### 7.2 Platform Highlights (`#about`)

**UI**
- A big white rounded card (`radius ≈ 28–32px`, `--shadow-card`) horizontally inset ≈ `24px` from viewport edges, **overlapping the bottom of the hero** (negative top margin ≈ `-90px`, so hero fade passes behind it). Inner padding ≈ `48–56px`.
- Header row uses `SectionHeader align="split"`:
  - Left: eyebrow `PLATFORM HIGHLIGHTS` (primary blue, uppercase, 14px) + title **"Built to make campus life easier"** (≈ `32px`, bold, 2 lines).
  - Right (max-width ≈ `340px`, muted, 12–13px, aligned to the right half): "Bring activities, participation, training scores, and essential campus services together in one place, making student life easier to manage and stay connected."
- Below: **3-column grid** of `FeatureCard` (gap ≈ `40px`). Each card:
  - Image (≈ `16:9`-ish, ≈ `205×105` in design, small radius `4–8px`, `object-fit: cover`).
  - Title (≈ `16px`, semibold).
  - Description (≈ `12–13px`, muted, 3 lines).
- Items (from `config/highlights.ts`):
  1. **Discover & Join Activities** — "Discover extracurricular activities, register for opportunities, and manage your participation with ease."
  2. **Track Your Student Journey** — "Keep track of your activities, attendance, training scores, and academic schedule in one place."
  3. **Stay Connected with Campus** — "Stay informed with timely notifications, university services, and personalized activity recommendations."

**Behavior**
- Static, no interaction (cards are not links). [ASSUMPTION] Optional subtle hover lift is allowed but not required.
- Type: `type Highlight = { id: string; title: string; description: string; image: { src: string; alt: string } }`.

### 7.3 Featured & Upcoming Activities (`#activities`) — API-driven

**UI (data present)**
- Header (`SectionHeader align="center"`): eyebrow `ACTIVITY DISCOVERY` (primary blue) + title **"Featured & Upcoming Activities"** (≈ `32px` bold).
- Grid (container width): **left = up to 2 large "featured" cards** (each ≈ `300px` wide), **right = up to 3 stacked "compact" cards** (≈ `320px` wide) — ≈ 5 cards total, gap ≈ `16–20px`.
- **`ActivityCard variant="featured"`** (vertical): white `SurfaceCard`, radius ≈ `12px`, padding ≈ `16–24px`:
  1. Cover image (≈ `16:9`, rounded, `object-fit: cover`).
  2. Title — UPPERCASE as provided by data, bold ≈ `14px`, clamp to **4 lines** (`line-clamp-4`) with ellipsis.
  3. Meta block (muted ≈ `11px`): tags line (e.g. "Academic, Science"), date-time (`17/10/2026, 8:00 - 10:00`), location (`I.32, HCMUS`) — `ActivityMeta`.
  4. Footer row: left `ActivityStatusBadge` (green dot + "Registration Open"); right text link **"View"** (muted, small).
- **`ActivityCard variant="compact"`** (horizontal): thumbnail left (≈ `100×80`, rounded), right: title (bold ≈ `12px`, uppercase as provided, clamp **3 lines**), category tag (italic/muted), date-time, location. No status row in the compact design.
- The second featured card in the PNG is a **design placeholder** showing labels "Key Tags / TIME / Location / Registration Status: Open/Closed/Upcoming" — it documents the *possible values*, not a different layout. Render it identically to the first featured card with real data.
- Status badge mapping (`registrationStatus`):
  - `open` → success (green dot) "Registration Open"
  - `upcoming` → warning/info dot "Registration Upcoming" (registration not yet started)
  - `closed` → neutral/red dot "Registration Closed"
- Whole card is one link (`next/link`) to `/activities/{id}`; the "View" label is a visual affordance (not a nested link). Hover: slight lift + shadow; focus-visible ring.
- Date-time format: `dd/MM/yyyy, H:mm - H:mm` (24h, timezone `Asia/Ho_Chi_Minh`). If the activity spans multiple days: `dd/MM/yyyy H:mm - dd/MM/yyyy H:mm`. Implement in `libs/format.ts` (`formatActivityTime(start, end)`).
- Image fallback: if `imageUrl` is null or fails to load, show `public/images/landing/activity-placeholder.png` (HCMUS logo on faded building — same as the placeholder thumbnails in the PNG). Remote hosts must be allowed in `next.config` (`images.remotePatterns`).

**Data contract**

```ts
// features/activities/types/activity.dto.ts  (wire format – adjust to backend)
export type ActivityDTO = {
  id: string;
  title: string;
  image_url: string | null;
  categories: string[];                 // e.g. ["Academic","Science"]
  start_time: string;                   // ISO 8601
  end_time: string;                     // ISO 8601
  location: string | null;
  registration_status: "open" | "upcoming" | "closed";
};
export type LandingActivitiesDTO = { featured: ActivityDTO[]; upcoming: ActivityDTO[] };

// features/activities/types/activity.ts  (UI model)
export type RegistrationStatus = "open" | "upcoming" | "closed";
export type Activity = {
  id: string; title: string; imageUrl: string | null; categories: string[];
  startTime: Date; endTime: Date; location: string | null;
  registrationStatus: RegistrationStatus; href: string;   // `/activities/${id}`
};
export type LandingActivities = { featured: Activity[]; upcoming: Activity[] };
```

Endpoint **[ASSUMPTION – confirm with backend]**: `GET /activities/landing` → `ApiResponse<LandingActivitiesDTO>` (reuse the envelope in `types/api.ts`). The FE slices defensively: `featured.slice(0, 2)`, `upcoming.slice(0, 3)`. Public endpoint (no auth required).

```ts
// features/activities/services/activity.service.ts
export interface ActivityService { getLandingActivities(signal?: AbortSignal): Promise<LandingActivities>; }
// mock.activity.service.ts implements the same interface; mock must be able to return
// full data, partial data, empty data, a delay, and a thrown error (for QA of every state).
```

**Hook**

```ts
// features/activities/hooks/useLandingActivities.ts
type Status = "loading" | "success" | "empty" | "error";
function useLandingActivities(): {
  status: Status; data: LandingActivities | null; error: Error | null; refetch: () => void;
}
// "empty" when featured.length === 0 && upcoming.length === 0 (after a successful 2xx response)
// Cancels the request on unmount (AbortController). One automatic retry is optional; manual retry via refetch().
```

**State machine → UI** (`ActivitiesSection` renders the header always, then one body):

| Status | Body |
|--------|------|
| `loading` | `ActivitiesSkeleton`: same grid footprint — 2 featured skeleton cards + 3 compact skeleton rows (image block, 3 text lines, footer line). `aria-busy="true"`. Prevents layout shift. |
| `success` | `ActivityGrid` per layout rules below |
| `empty` | `EmptyState`: calendar icon, title **"No activities available right now"**, description **"New activities will appear here as soon as they are announced. Please check back soon."** Optional action: none for guests; do not render the grid frame. (Same height ≈ one card row to avoid a collapsing section.) |
| `error` | `ErrorState`: title **"We couldn't load activities"**, description "Please check your connection and try again.", **Try again** button → `refetch()`. The rest of the page stays fully usable. |

**Layout rules (`ActivityGrid`)**
1. `featured.length ≥ 1` and `upcoming.length ≥ 1` → 2/1-style layout as designed (featured columns left, compact stack right). If only 1 featured exists, it takes the left column and the compact stack stays on the right.
2. `featured.length ≥ 1`, `upcoming.length === 0` → featured cards only, equal-width columns spanning the container (no empty right column).
3. `featured.length === 0`, `upcoming.length ≥ 1` → render upcoming items with the **featured card variant** in a responsive grid (max 3 columns).
4. Both empty → `empty` state (never render an empty grid).
- Mobile: single column; compact cards keep horizontal layout.

### 7.4 HCMUS Services — Quick Access (`#services`) — auth-gated

**UI**
- Full-bleed section, background `--color-primary-dark`, padding ≈ `64px` vertical. White text on top (`SectionHeader tone="dark"`): eyebrow `HCMUS SERVICES` (uppercase, small, white/70%) + title **"Quick access to essential university services"** (≈ `32px` bold, left aligned, 2 lines).
- Grid of `ServiceCard`: **3 columns × 2 rows** (gap ≈ `32px` column, `24px` row), each card:
  - White pill/rounded container (≈ `240×64`, radius ≈ `32px`), left: service icon/logo tile (≈ `48px`, rounded), then service name (bold ≈ `16–18px`, dark) and below it a small blue link text **"Access →"** (`ArrowRightIcon`).
- Services (from `config/services.ts`; order = row-major):
  1. Moodle (fit@hcmus logo) — public
  2. Tuition Payment — locked for guests
  3. [TBD name, light-blue icon] — locked
  4. Student Portal (blue icon) — public
  5. HCMUS Website (green icon) — locked
  6. [TBD name, red icon] — locked

```ts
type ServiceItem = {
  id: string; name: string; href: string;        // external URL
  icon: { src: string; alt: string };
  access: "public" | "authenticated";            // authenticated => blurred for guests
};
```

**Guest vs authenticated behavior (key requirement)**
- **Guest** (`!isAuthenticated`): items with `access: "public"` (first column in the design: Moodle, Student Portal) render normally and are clickable. Items with `access: "authenticated"` render **blurred** ("half visible, half hidden"):
  - CSS `filter: blur(6px–8px)` (blur grows slightly toward the right edge in the design: column 2 ≈ light, column 3 ≈ heavier — implement with per-column blur or a left-to-right mask; a single uniform blur is acceptable), reduced opacity ≈ `0.85`.
  - `pointer-events: none`, `aria-hidden="true"`, `inert`, `tabIndex={-1}`; text must not be selectable.
  - Optional overlay (recommended, not in the PNG) **[ASSUMPTION]**: a centered pill over the blurred area with `LockIcon` + "Log in to see all services" → `/login` (preserve return target: `/login?redirectTo=/%23services` or whatever convention `libs/navigation.ts` already uses).
- **Authenticated**: all cards fully visible and clickable; blur removed (can animate `filter` over ≈ `300ms` once auth resolves).
- `isLoading`: render the **guest (locked) version** to avoid showing protected cards for a flash; unlock when resolved. DOM structure is identical so there is no layout shift.
- Security note: blur is a UX hint only. Protected URLs are not secrets; if a service must be truly protected it is protected by the target system. Do not render real hrefs for locked cards in guest state (use `href` only when unlocked).
- External links: `target="_blank"`, `rel="noopener noreferrer"`. Card hover: slight lift/shadow; focus-visible ring (white on blue).

### 7.5 Help / Guide (`#help`)

**UI**
- White background section, padding ≈ `64px` vertical. Decorative **primary-dark circles** (aria-hidden, `overflow: hidden` on section):
  - Large circle partially off-canvas at the **top-right** (≈ `300px` radius, overlapping the boundary with the Services section above).
  - Small circle partially visible at the **bottom-left** edge (≈ `45px` visible radius), touching the footer boundary.
- Header: eyebrow **"Help / Guide"** (primary blue, ≈ `16px`, semibold, not uppercase) + title **"Find quick guides and answers to common questions."** (≈ `32px` bold, left, max-width ≈ `560px`, 2 lines).
- **2×2 grid** of `GuideCard` (card ≈ `310×70`, gap ≈ `60px` col / `32px` row), each a link:
  - Background vertical gradient white → light blue, small radius ≈ `10px`, subtle shadow.
  - Title: uppercase bold ≈ `16–18px`; subtitle: regular ≈ `14px` muted; **right arrow** icon aligned right.
- Items (`config/guides.ts`):

| Title | Subtitle | Target |
|-------|----------|--------|
| GETTING STARTED | Learn the basics | `/help#getting-started` |
| ACTIVITIES | How to register? | `/help#activities` |
| TRAINING SCORE | Track your DRS | `/help#training-score` |
| FAQ | Common questions | `/help#faq` |

  [ASSUMPTION] `/help` does not exist yet; keep hrefs in config so they can be repointed. Until the page exists, links may be disabled (`aria-disabled`) or point to a "coming soon" page — decide with the team.

**Behavior**: whole card is a link; hover → arrow nudges right ≈ `4px`, shadow increases; keyboard focus ring.

### 7.6 Footer (`#contact`)

**UI**
- Full-bleed `--color-primary-dark`, large vertical padding (design shows a tall block ≈ `260px`), white text.
- Design is a **placeholder**: heading "Footer" and "Contact services, Hotlines…." **[TBD]** final content. Implement the component structure now so content can be dropped in via `config/footer.ts`:
  - Brand column: `Logo` (light variant) + one-line description.
  - Contact column: address, hotline(s), email.
  - Quick links column: Home, About Us, Activities, Services, Help (reuse `nav.ts`).
  - Bottom bar: copyright `© {year} HCMUS` (year computed, not hardcoded).
- Phone/email render as `tel:` / `mailto:` links.
- Component: `components/layout/SiteFooter.tsx`, reusable on other public pages.

---

## 8. User Flows

### 8.1 Guest — first visit
1. Lands on `/` → header (Log In), hero, highlights render immediately (static).
2. `ActivitiesSection` mounts → skeleton → API → (success | empty | error) per §7.3.
3. Scrolls to Services: sees Moodle + Student Portal clearly, other cards blurred + (optional) "Log in to see all services".
4. Clicks **Log In** (header / overlay / Get Started) → `/login` (return target preserved). After login, `AuthProvider` sets the user and the app redirects to the role dashboard (existing auth flow) or back to `#services` if `redirectTo` is used.
5. Clicks an activity card → `/activities/{id}` [ASSUMPTION: detail page is publicly viewable; registering requires login].
6. Clicks a guide card → `/help#…`.

### 8.2 Authenticated user (student / organizer / admin)
1. Lands on `/` (no forced redirect). Header shows **Dashboard** (+ user menu).
2. Services section is fully unlocked (blur removed).
3. **Get Started** and **Dashboard** → `getDashboardPath(role)` (`/student/dashboard`, `/organizer/dashboard`, `/admin/dashboard`).
4. Activities behave the same as for guests.

### 8.3 Activities API outcomes
- Slow response: skeleton persists (no timeout UI needed; abort on unmount).
- 2xx with data: render per layout rules.
- 2xx with empty lists: empty state (not an error).
- Network/5xx/invalid payload: error state + **Try again** (re-enters `loading`).
- 401/403 must not occur (public endpoint); if it does, treat as `error`.

### 8.4 Navigation
Header link click → smooth scroll to section (accounting for floating header height via `scroll-margin-top`); direct visit to `/#services` scrolls on load; scroll-spy updates active link; browser back works with hashes.

---

## 9. Non-functional Requirements

- **Accessibility**: semantic landmarks (`header`, `main`, `section[aria-labelledby]`, `footer`); one `h1` (hero headline), section titles `h2`, card titles `h3`; visible focus rings; meaningful `alt` for content images, `alt=""` for decoration; contrast ≥ 4.5:1 (check gold headline over photo — keep text-shadow); respect `prefers-reduced-motion` (disable smooth scroll/lift animations); blurred locked cards hidden from assistive tech.
- **Performance**: hero image `priority`; below-fold images lazy; `next/image` with explicit `sizes`; no layout shift (skeletons share dimensions with real cards); activities fetch must not block first paint.
- **SEO**: `metadata` in `app/(public)/page.tsx` (title "myHCMUS — Extracurricular activities & training scores", description, OpenGraph image).
- **i18n readiness**: keep all copy in `config/*.ts` and component props rather than inline JSX strings; UI language is English. Activity titles arrive as-is (Vietnamese).
- **Error isolation**: a failure in one section (activities) must never break others; consider a section-level error boundary around `ActivitiesSection`.
- **Testing**: unit-test `formatActivityTime`, `activity.mapper`, `useLandingActivities` (all four states via the mock service), `ServicesSection` (guest vs authenticated rendering), `ActivityGrid` layout rules (1/2 featured × 0/1/3 upcoming).

---

## 10. Implementation Order (suggested)

1. Design tokens in `globals.css`; `components/ui/*` primitives and icons.
2. `SiteHeader`, `SiteFooter`, `Logo`; move landing route to `app/(public)/page.tsx`.
3. Static sections: Hero, Highlights, Help (+ configs).
4. Activities: types → mapper → mock service → hook → skeleton/empty/error → cards → grid → real service.
5. Services section with auth gating via `useAuth`.
6. Scroll-spy, anchors, responsive pass, a11y pass, tests.

## 11. Open Questions

- Final copy for hero headline ("Grown." vs "Grow.") and the two unnamed services.
- Backend endpoint/shape for landing activities (§7.3) and whether activity detail is public.
- Whether `/activities` and `/help` pages exist yet (affects CTA/guide targets).
- Footer final content.
- Whether the "Log in to see all services" overlay is approved.