# Phase 1 Data Model: Public Landing Page

**Feature**: `001-landing-page` | **Date**: 2026-11-13

This model separates wire DTOs, domain/UI models, and presentation state. Components and hooks consume domain models only. The backend contract is unconfirmed, so the DTO section is explicitly provisional.

## Entities

### Visitor / Auth State

Represents the person viewing the landing page. The landing page does not own authentication; it reads the existing `useAuth()` context.

```ts
type SessionUserView = {
  role: "student" | "organizer" | "admin";
  fullName: string;
  avatarUrl: string | null;
};

type AuthViewState =
  | { status: "loading"; user: null }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: SessionUserView };
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | `loading \| guest \| authenticated` | Yes | Derived from `isLoading`, `isAuthenticated`, and `user` |
| `user.role` | `student \| organizer \| admin` | Authenticated only | Determines dashboard path |
| `user.fullName` | `string` | Authenticated only | Available for future header user menu; not required by this feature |
| `user.avatarUrl` | `string \| null` | No | Not required for the landing page |

**Invariants**:
- `loading` never exposes a signed-in-only action.
- `guest` never exposes a protected service destination.
- `authenticated` always resolves a dashboard path.
- The landing page never redirects an authenticated visitor away from `/`.

### Activity DTO (provisional wire model)

```ts
type RegistrationStatusDTO = "open" | "upcoming" | "closed";

type ActivityDTO = {
  id: string;
  title: string;
  image_url?: string | null;
  categories?: string[] | null;
  start_time: string; // ISO 8601
  end_time: string;   // ISO 8601
  location?: string | null;
  registration_status: RegistrationStatusDTO;
};

type GroupedLandingActivitiesDTO = {
  featured?: ActivityDTO[];
  upcoming?: ActivityDTO[];
};

type ListLandingActivitiesDTO = {
  activities: ActivityDTO[];
};

type LandingActivitiesDTO =
  | GroupedLandingActivitiesDTO
  | ListLandingActivitiesDTO;

type LandingActivitiesResponseDTO = {
  data: LandingActivitiesDTO;
};
```

**Provisional contract**: `GET /activities/landing` returns `LandingActivitiesResponseDTO`. Field names and the envelope are assumptions to confirm with the backend. The DTO must not be imported by components.

### Activity (domain/UI model)

```ts
type RegistrationStatus = "open" | "upcoming" | "closed";

type Activity = {
  id: string;
  title: string;
  imageUrl: string | null;
  categories: string[];
  startTime: Date;
  endTime: Date;
  location: string | null;
  registrationStatus: RegistrationStatus;
  href: string;
};

type LandingActivities = {
  featured: Activity[];
  upcoming: Activity[];
};
```

| Field | Type | Required | Source/derivation |
|-------|------|----------|-------------------|
| `id` | `string` | Yes | Non-empty DTO `id`; used to form `href` |
| `title` | `string` | Yes | Preserved exactly as supplied; no case transformation |
| `imageUrl` | `string \| null` | No | Blank/missing DTO value becomes `null`; UI falls back on load failure |
| `categories` | `string[]` | No | Empty array when missing/blank; UI omits the line |
| `startTime` | `Date` | Yes | Parsed from ISO; must be valid |
| `endTime` | `Date` | Yes | Parsed from ISO; must be valid and not before `startTime` |
| `location` | `string \| null` | No | Blank/missing becomes `null`; UI omits the line |
| `registrationStatus` | `RegistrationStatus` | Yes | Recognized DTO union value |
| `href` | `string` | Yes | `/activities/${encodeURIComponent(id)}` |
| `featured` | `Activity[]` | Yes (may be empty) | Explicit featured group only |
| `upcoming` | `Activity[]` | Yes (may be empty) | Explicit upcoming group or single-list items |

**Invariants**:
- `endTime >= startTime`.
- `id` and `title` are not empty after validation; the original title string is preserved.
- The title is never trimmed or case-transformed for display.
- A `LandingActivities` value never contains raw DTO fields.
- `LandingActivities` represents the display-ready collection after invalid-item filtering and display caps.

### Activity Display Collection

The mapper normalizes the two wire shapes into one domain collection:

| Wire shape | Domain result | Display behavior |
|------------|---------------|------------------|
| Explicit groups | `featured.slice(0, 2)` after filtering; `upcoming.slice(0, 3)` after filtering | Featured cards left; compact cards right |
| Single ordered list | `featured = []`; `upcoming = validItems.slice(0, 5)` | All items use the featured card style; max 3 columns |
| Both groups empty | `featured = []`; `upcoming = []` | Empty state; no grid |
| Raw items present but all invalid | Mapping error | Error state; no broken cards |

The mapper filters invalid items before slicing so that later valid items can fill the display slots.

### Navigation Link

```ts
// shared in src/types/navigation.ts because shared layout chrome consumes it
type NavigationLink = {
  id: SectionId;
  label: string;
  href: `#${SectionId}`;
};

type SectionId =
  | "home"
  | "about"
  | "activities"
  | "services"
  | "help"
  | "contact";
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Stable anchor target |
| `label` | Yes | Header/footer label |
| `href` | Yes | Hash destination |

**Invariants**:
- Header links cover Home, About Us, Activities, Services, and Help.
- Footer quick links reuse the same source.
- Contact is a section target but is not required in the header link set.
- Active state uses `aria-current="location"` and a visible non-color cue.

### Highlight

```ts
type Highlight = {
  id: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
};
```

**Invariants**:
- Exactly three highlights.
- Informational only; never rendered as a link.
- Image alt text describes the content.

### Service Entry

```ts
type ServiceEntry = {
  id: string;
  name: string;
  href: string;
  icon: {
    src: string;
    alt: string;
  };
  access: "public" | "authenticated";
  available: boolean;
};
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | Yes | Stable config key |
| `name` | Yes | Must not be invented when unconfirmed |
| `href` | Yes for available entries | External destination; no href is rendered for locked cards |
| `icon` | Yes | Local icon/logo source and alt |
| `access` | Yes | `public` or `authenticated` |
| `available` | Yes | Allows confirmed services to ship before all six are known |

**Invariants**:
- The layout supports fewer than six entries but does not invent entries.
- Guest: only `public` entries render as links.
- `authenticated` entries render as non-link, inert, `aria-hidden` cards for guests and during auth loading.
- Locked cards expose no destination and are excluded from keyboard and assistive technology.
- Signed-in: all available entries render as links.
- External links use `target="_blank"` and `rel="noopener noreferrer"`.
- There is no overlay invitation over locked cards.

### Guide Entry

```ts
type GuideEntry = {
  id: string;
  title: string;
  subtitle: string;
  href: string | null;
  available: boolean;
};
```

**Invariants**:
- Exactly four guide cards.
- The whole card is one link when available.
- An unavailable destination (`href: null`, `available: false`) renders as a non-interactive unavailable card, not a dead link.
- Uppercase presentation is allowed for guide titles by config/copy; activity titles are not case-transformed.

### Footer Content

```ts
// shared in src/types/site.ts because shared layout chrome consumes it
type FooterContent = {
  brandDescription: string;
  contactHeading: string;
  address: string;
  phones: string[];
  email: string;
  quickLinksHeading: string;
  quickLinks: NavigationLink[];
};
```

**Invariants**:
- Phone numbers render as `tel:` links.
- Email renders as a `mailto:` link.
- Copyright year is derived at presentation time.
- Final wording remains configurable; no placeholder copy is treated as final.

### SEO Metadata

```ts
type LandingSeo = {
  title: string;
  description: string;
  openGraphImage: string;
};
```

**Invariants**:
- Metadata is exported from the Server Component route.
- No client-only module is imported by the metadata source.

## Mapping Rules

### `mapActivityDTO(dto: ActivityDTO): Activity | null`

Returns `null` when any required field is unusable:

1. `id` is missing, not a string, or empty after trimming.
2. `title` is missing, not a string, or empty after trimming.
3. `start_time` or `end_time` is missing, not a string, not a valid date, or lacks an explicit timezone offset (`Z` or `±HH:MM`).
4. `end_time` is earlier than `start_time`.
5. `registration_status` is not one of `open`, `upcoming`, or `closed`.

Normalization for usable records:

- Preserve the original `title` string.
- `image_url` blank/missing → `null`.
- `categories` missing/not an array → `[]`; remove blank strings.
- `location` blank/missing → `null`.
- `href` = `/activities/${encodeURIComponent(id)}`.
- Convert ISO strings to `Date` objects.

### `mapLandingActivitiesDTO(dto: LandingActivitiesDTO): LandingActivities`

1. Detect the shape:
   - Has `activities` array → single-list mode.
   - Has `featured` and/or `upcoming` arrays → grouped mode.
   - Both shapes present → throw `InvalidLandingActivitiesError` (`INVALID_PAYLOAD`).
   - Neither shape present → throw `InvalidLandingActivitiesError` (`INVALID_PAYLOAD`).
2. Map each raw item with `mapActivityDTO`; collect valid items and count raw items.
3. If raw item count > 0 and valid item count === 0 → throw `InvalidLandingActivitiesError`.
4. Grouped mode:
   - A missing group is treated as an empty array.
   - `featured = validFeatured.slice(0, 2)`.
   - `upcoming = validUpcoming.slice(0, 3)`.
   - A group with invalid items but valid items in the other group does not throw.
5. Single-list mode:
   - `featured = []`.
   - `upcoming = validItems.slice(0, 5)`.
6. Return the domain collection.

### Error type

```ts
class InvalidLandingActivitiesError extends Error {
  readonly code: "INVALID_PAYLOAD" | "NO_USABLE_ITEMS";
}
```

- `INVALID_PAYLOAD`: the response cannot be interpreted as either supported shape.
- `NO_USABLE_ITEMS`: raw items existed but none were usable.
- The hook converts either code into the error outcome. The UI uses fixed copy and never displays the raw error.

## Activity State Machine

```text
idle
  └─ mount/refetch → loading
       ├─ success (non-empty) → success
       ├─ success (empty) → empty
       └─ service/mapping failure → error
error
  └─ refetch → loading
success/empty
  └─ refetch → loading
```

| State | `data` | `error` | UI body | Announcement |
|-------|--------|---------|---------|--------------|
| `loading` | `null` | `null` | Skeleton with 2 featured + 3 compact footprints | Busy status; polite announcement |
| `success` | `LandingActivities` | `null` | `ActivityGrid` | Loaded status; no focus move |
| `empty` | zero-item collection or `null` | `null` | EmptyState with reserved height | Empty status; no focus move |
| `error` | `null` | `Error` | ErrorState with Try again | Error status; no focus move |

**Transitions**:
- `refetch()` aborts the current request and enters `loading`.
- On retry, focus moves to the stable activity section heading/container rather than being dropped to the page start; the terminal outcome is announced without further focus movement.
- An aborted request never produces a visible state change.
- A response from an older request id is ignored.
- Repeated retries settle in exactly one terminal state.
- Unmount aborts the in-flight request.

## Header and Navigation State

| State | Values | Behavior |
|-------|--------|----------|
| Auth action | `loading`, `guest`, `authenticated` | Reserved width; guest Log In; authenticated Dashboard |
| Mobile menu | `closed`, `open` | Native modal dialog; focus trap; scroll lock; Escape/backdrop close; focus restore |
| Active section | one of the tracked section ids | `aria-current="location"` plus underline/weight cue |
| Hash | empty or `#section` | Direct load, back/forward, and link activation restore the section |

**Invariants**:
- The header never shows Dashboard during auth loading.
- The mobile menu contains the same links and auth action as desktop.
- The rest of the page is inert while the modal menu is open.
- Closing without navigation returns focus to the menu trigger.
- Selecting a section closes the menu and moves focus to the section target.

## Services State

| Auth state | Public services | Authenticated-only services |
|------------|-----------------|-----------------------------|
| `loading` | Usable | Locked, inert, hidden from assistive technology |
| `guest` | Usable | Locked, inert, hidden from assistive technology |
| `authenticated` | Usable | Usable, fully visible, real links |

**Invariants**:
- Locked cards are not links and have no destination in the DOM.
- Locked card text is not selectable.
- The same outer dimensions are used in all states to avoid layout shift.
- No separate sign-in invitation is rendered over locked cards.
- The header Log In action is the guest sign-in path.

## Persistence and Boundaries

- No new persistence layer.
- Activity data is fetched at runtime; no caching or global store is introduced in this feature.
- The existing session cookie remains owned by the auth layer; the landing page never reads it directly.
- Config modules are static at build time; pending content is updated in one place.
- DTOs never cross the service/mapper boundary into components.
