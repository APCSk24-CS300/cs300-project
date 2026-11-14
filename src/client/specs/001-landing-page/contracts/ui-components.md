# Contract: Shared UI and Landing Components

**Feature**: `001-landing-page` | **Status**: Planned

These contracts keep the landing page on the shared component layers required by the constitution. Generic primitives live in `src/components/ui`; site chrome lives in `src/components/layout`; landing- and activity-specific composition stays in features.

## Generic Primitives (`src/components/ui`)

### Button

```ts
type ButtonProps = {
  variant: "primary" | "secondary" | "white" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
};
```

Behavior:

- Renders `next/link` when `href` is present; otherwise renders `<button>`.
- Loading state keeps an accessible name and sets `aria-busy="true"`; it does not render a spinner-only control.
- Disabled link buttons are not focusable and expose no destination.
- Variants, sizes, radii, focus ring, and colors come from tokens and shared class maps.
- No `any` in the implementation.

### Container

```ts
type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
};
```

Behavior:

- Applies the landing maximum width and page gutter.
- Does not impose a background or semantic role unless requested.

### Section

```ts
type SectionProps = {
  id?: string;
  labelledBy?: string;
  background?: "none" | "primary-dark";
  children: React.ReactNode;
  className?: string;
};
```

Behavior:

- Renders a semantic `<section>`.
- Applies `scroll-margin-top` from the header-height token plus the design gap.
- Uses `aria-labelledby` when `labelledBy` is supplied.
- Background variants use tokens only.

### SectionHeader

```ts
type SectionHeaderProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center" | "split";
  tone?: "light" | "dark";
  className?: string;
};
```

Behavior:

- Renders the section title as `h2`.
- `id` is used by the containing section's `aria-labelledby`.
- `tone="dark"` uses the on-primary token set.
- `align="split"` lays the title and description as the design requires; narrow screens stack them.
- Eyebrows are decorative labels, not headings.

### Badge

```ts
type BadgeProps = {
  tone: "success" | "warning" | "neutral" | "info";
  withDot?: boolean;
  children: React.ReactNode;
  className?: string;
};
```

Behavior:

- Always renders visible text; color is not the only cue.
- `withDot` renders a decorative dot hidden from assistive technology.
- Status labels are supplied by the activity feature, not hardcoded in the primitive.

### Tag

```ts
type TagProps = {
  children: React.ReactNode;
  className?: string;
};
```

Behavior:

- Renders a small non-interactive label.
- Does not add key semantics; category lists provide their own grouping/labeling.

### Skeleton

```ts
type SkeletonProps = {
  className?: string;
};
```

Behavior:

- Renders a decorative pulse block with `aria-hidden="true"`.
- Respects reduced motion with `motion-reduce:animate-none`.
- Dimensions are controlled by the consuming skeleton layout so the real content does not shift.

### EmptyState

```ts
type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};
```

Behavior:

- Renders a non-interactive presentational region.
- The caller supplies the reserved height needed to prevent layout collapse.
- The icon is decorative and hidden from assistive technology.

### ErrorState

```ts
type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};
```

Behavior:

- Renders a human-readable message and an optional retry button.
- The retry button is a real `<button>` with a visible focus ring.
- Never renders raw server error text.
- The error state does not take focus automatically. On retry, the caller moves focus to the stable section heading/container so focus is not dropped to the page start when the retry button unmounts.

### SurfaceCard

```ts
type SurfaceCardProps = {
  children: React.ReactNode;
  gradient?: boolean;
  className?: string;
};
```

Behavior:

- Renders the shared white card surface, radius, and shadow from tokens.
- `gradient` applies the guide-card gradient tokens.
- Does not add a link or role by itself.

## Site Chrome (`src/components/layout`)

### Logo

```ts
type LogoProps = {
  variant?: "default" | "light";
  href?: string;
  className?: string;
};
```

Behavior:

- Renders the myHCMUS wordmark with the gold/primary token treatment.
- Defaults to a link to `/` (top of landing).
- The link has an accessible name of "myHCMUS home".
- Uses the existing logo asset or wordmark treatment without hardcoded colors.

### SiteHeader

```ts
type SiteHeaderProps = {
  links: NavigationLink[]; // shared type from src/types/navigation.ts
};
```

Behavior:

- Client component.
- Receives the section links from the landing config; it does not import feature internals.
- Desktop: brand, five section links, auth action.
- Below `lg`: brand, menu trigger, modal drawer.
- Auth action states: reserved-width skeleton, Log In, Dashboard.
- Log In href includes the active section as a safe return target.
- Dashboard href uses `getDashboardPath(user.role)`.
- Active link uses `aria-current="location"` and a visible underline/weight cue.
- Mobile menu uses a native modal `<dialog>`; background is inert; Escape/backdrop close; focus returns to the trigger.
- No signed-in-only action flashes during auth loading.

### SiteFooter

```ts
type SiteFooterProps = {
  content: FooterContent; // shared type from src/types/site.ts
};
```

Behavior:

- Server component.
- Receives all content through the shared `FooterContent` type; it does not import landing feature config.
- Renders the `contact` anchor target as the root `<footer id="contact">`.
- Renders brand, contact, quick links, and bottom bar.
- Contact and quick-link headings come from the footer config.
- Phone/email are `tel:`/`mailto:` links.
- Quick links reuse the header navigation source.
- Copyright year is rendered by the small `CopyrightYear` client island so it reflects the current year at presentation rather than a build-time constant.
- Column headings follow the page's heading hierarchy.

## Landing Components (`src/features/landing/components`)

### LandingPage

```ts
type LandingPageProps = Record<string, never>;
```

- Server component.
- Composes `SiteHeader`, `main`, the five content sections, and `SiteFooter`.
- Imports `ActivitiesSection` from the activities public barrel only.

### HeroSection

```ts
type HeroSectionProps = Record<string, never>;
```

- Server component.
- Renders the single `h1`, subtitle, `HeroVisual`, and `HeroActions`.
- Text remains readable over the fallback background if the visual fails.

### HeroVisual

```ts
type HeroVisualProps = {
  src: string;
  alt: string;
};
```

- Client component only because it handles image load failure.
- Uses `next/image` with `preload` for the hero.
- On failure, renders a token-backed fallback that preserves the hero layout.

### HeroActions

```ts
type HeroActionsProps = {
  activitiesHref: string;
};
```

- Client component.
- Guest: Get Started → `/login`.
- Authenticated: Get Started → `getDashboardPath(user.role)`.
- Explore → `activitiesHref` (currently `#activities`; configurable for a later `/activities` page).
- While auth is loading, uses the guest-safe login path.

### HighlightsSection

- Server component.
- Exactly three `FeatureCard` items from config.
- Cards are not links.

### FeatureCard

```ts
type FeatureCardProps = {
  highlight: Highlight;
};
```

- Renders image, `h3` title, and description.
- Image alt is content-descriptive; decorative shapes are hidden.
- No link wrapper.

### ServicesSection

- Client component.
- Reads auth state and service config.
- Guest/loading: public links usable; authenticated-only cards locked.
- Authenticated: all available services usable.
- No overlay invitation.
- The section header remains visible in every state.

### ServiceCard

```ts
type ServiceCardProps = {
  service: ServiceEntry;
  locked: boolean;
};
```

- Each card shows an icon, the service name, and an "Access" affordance.
- Locked: no `<a>`, no href, `inert`, `aria-hidden="true"`, no text selection; the Access affordance is visual only.
- Unlocked: whole card is a link with an accessible name; external links use `target="_blank"` and `rel="noopener noreferrer"`.
- Same dimensions in both states to prevent layout shift.
- Icon is decorative when the service name already provides the accessible name; otherwise it has alt text.

### HelpSection

- Server component.
- Four `GuideCard` items in a two-column grid at `sm` and above.

### GuideCard

```ts
type GuideCardProps = {
  guide: GuideEntry;
};
```

- Available: whole card is one link with an arrow; visible focus ring; hover arrow nudge suppressed under reduced motion.
- Unavailable: non-interactive, non-link, excluded from keyboard navigation, and clearly presented as unavailable.
- Title uses the configured uppercase presentation; the card does not invent a destination.

## Activity Components (`src/features/activities/components`)

### ActivitiesSection

- Client component.
- Renders the section header in every outcome; header, status-label, empty, and error copy come from `features/activities/config.ts`.
- Renders exactly one body: skeleton, grid, empty state, or error state.
- The state region is announced without moving focus.
- Retry returns to loading and ends in exactly one terminal outcome.

### ActivityGrid

```ts
type ActivityGridProps = {
  activities: LandingActivities;
};
```

- Featured + upcoming: featured area left, compact stack right.
- Featured only: featured cards span the available width; one uses one column, two use two.
- Upcoming only: featured-style cards in a responsive grid of up to five items, max three columns.
- Neither: callers must use the empty state; the grid never renders an empty frame.
- No clipping, overlap, or horizontal scrolling during reflow.

### ActivityCard

```ts
type ActivityCardProps = {
  activity: Activity;
  variant: "featured" | "compact";
};
```

Featured:

- Whole card is one `next/link` to `activity.href`.
- Cover image with fallback, `h3` title, categories line, date/time, location, status badge, and a visual "View" affordance that is not a separate link.
- Title clamps to four lines.
- Omit categories/location lines when empty.
- Title is rendered exactly as supplied; no `text-transform: uppercase`.
- Status uses text plus a non-color indicator.

Compact:

- Whole card is one link.
- Horizontal thumbnail + text layout.
- One category (first supplied) when present.
- Date/time and location; no status row.
- Title clamps to three lines.
- Keeps horizontal form on narrow screens.

### ActivityMeta

```ts
type ActivityMetaProps = {
  dateTime: string;
  location: string | null;
  categories?: string[];
  compact?: boolean;
};
```

- Renders calendar/location icons as decorative.
- Omits missing lines without empty punctuation.
- Date/time string comes from `formatActivityTime`.

### ActivityStatusBadge

```ts
type ActivityStatusBadgeProps = {
  status: RegistrationStatus;
};
```

- `open` → "Registration Open" + success tone + dot.
- `upcoming` → "Registration Upcoming" + warning tone + dot.
- `closed` → "Registration Closed" + neutral tone + dot.
- Always includes visible text.

### ActivityImage

```ts
type ActivityImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};
```

- Uses `next/image` with fixed dimensions/aspect ratio.
- On null or load failure, renders the branded placeholder without changing dimensions.
- Placeholder is decorative when the title already identifies the card.

### ActivitiesSkeleton

- Mirrors the grouped layout footprint: two featured card skeletons and three compact skeleton rows.
- Uses `aria-hidden="true"` on the blocks; the containing region is `aria-busy="true"`.
- Preserves dimensions during the single-list reflow.
- Reduced motion disables pulse animation.

## Shared Presentation Rules

- All colors, radii, shadows, and focus rings come from the token layer in `globals.css`.
- All interactive elements have visible focus indicators.
- All content images have meaningful alt text; decorative images use empty alt and are hidden.
- All cards that are links expose one accessible name and contain no nested interactive elements.
- All state announcements are polite and do not move focus unexpectedly.
- All motion respects `prefers-reduced-motion`.
- All touch targets are at least 44x44px.
