# Feature Specification: Public Landing Page

**Feature Branch**: `001-landing-page`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Build the public Landing Page at route '/'. Read docs/spec/landing-page-spec.md, especially sections 1, 2, 7, and 8, as the primary source of requirements. Implement the six Landing Page sections; define user-facing behavior and interactions; describe navigation and user flows; specify activity discovery behavior; define loading, empty, error, and success states; include responsive behavior and accessibility requirements. Frontend-only feature; backend handled by a separate team; do not assume proposed API contracts are confirmed; identify unclear requirements and assumptions explicitly; do not invent additional product features."

## Clarifications

### Session 2026-11-13

- Q: When activity content is missing required fields (such as title, start or end time, registration status, or identifier), how should the landing page respond? → A: Skip invalid items and render the valid ones; if every returned item is unusable, show the error outcome.
- Q: When activity content supplies only one ordered list without explicit featured and upcoming groupings, how should the landing page decide which activities are featured? → A: Treat all as upcoming; render up to five items in the featured-card style, at most three columns.
- Q: After a signed-out visitor completes sign-in from the landing page, where should the app take them? → A: Follow the entry point: Get Started leads to the role dashboard; header Log In returns to the originating landing location, including the services section when sign-in starts there.
- Q: Should the signed-out services section show a visible "Log in to see all services" invitation over the obscured cards? → A: No. Blur only; rely on the header Log In action, matching the UI reference.
- Q: When the header menu opens on a narrow screen, should it behave as a modal drawer or as an inline disclosure? → A: Modal drawer with trapped focus, locked page scrolling, Escape or scrim dismissal, and focus returning to the trigger.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest discovers the platform and activities (Priority: P1)

A first-time visitor opens the public home page, immediately understands what myHCMUS offers, sees featured and upcoming activities, and can choose to sign in, jump to the activity section, or continue exploring the page.

**Why this priority**: This is the primary public entry point and the main value of the feature. Without it there is no landing experience at all.

**Independent Test**: Load the home page as a signed-out visitor with grouped activity content available and verify that all six sections render, up to two featured and three compact activities appear, the header shows a sign-in action, and both hero actions behave as described.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor opens the home page, **When** the page loads, **Then** the header, hero, platform highlights, help, and footer are visible immediately while the activity area shows loading placeholders.
2. **Given** grouped activity content becomes available, **When** loading completes, **Then** at most two featured activities and at most three compact activities are shown with image, title, categories, date and time, location, and registration status where applicable.
3. **Given** a signed-out visitor activates "Get Started", **When** the action completes, **Then** the sign-in experience opens, and after successful sign-in the visitor lands on the dashboard for their role.
4. **Given** a signed-out visitor activates "Explore the activities", **When** the action completes, **Then** the view moves to the activity section and the address reflects that section.
5. **Given** the visitor selects an activity card, **When** the action completes, **Then** the corresponding activity detail destination opens.

---

### User Story 2 - Activity discovery remains clear in every outcome (Priority: P2)

A visitor encounters slow, empty, partial, or failed activity content and still receives a clear, honest explanation with a way forward, while the rest of the page remains usable.

**Why this priority**: Activity discovery depends on an external data source. Trustworthy handling of every outcome is required for the landing page to be usable in real conditions.

**Independent Test**: Drive the activity area through loading, populated, empty, partial, and failed outcomes using controlled test content, and verify the rendered message, layout adaptation, and retry behavior for each.

**Acceptance Scenarios**:

1. **Given** grouped activity content is still loading, **When** the visitor views the section, **Then** placeholders match the expected grouped layout and the area is announced as busy without shifting the page. If the data source later supplies a single ungrouped list, the section may reflow without clipping, overlap, or horizontal scrolling.
2. **Given** the data source returns no activities, **When** loading completes, **Then** an empty message explains that new activities will appear and no empty grid is shown.
3. **Given** the data source fails, **When** loading completes, **Then** an error message and a "Try again" action appear while every other section remains fully usable.
4. **Given** the visitor activates "Try again", **When** retry starts, **Then** the section returns to its loading presentation and ends in a success, empty, or error outcome.
5. **Given** only featured activities exist, **When** content renders, **Then** featured cards occupy the available width without leaving an empty column.
6. **Given** only upcoming activities exist, including when the data source supplies a single ungrouped list, **When** content renders, **Then** those activities are shown in the featured card presentation.

---

### User Story 3 - Guest sees which services require sign-in (Priority: P3)

A signed-out visitor can use the publicly available university services and clearly understands that other services require an account, with the header sign-in action as the available path.

**Why this priority**: Services are a core promise of the platform, and the locked presentation is the main conversion path from the landing page.

**Independent Test**: Load the services section as a signed-out visitor and verify public services are usable, protected services are obscured and unreachable, and the header sign-in action remains available.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor views the services area, **When** it renders, **Then** publicly available services are fully visible and usable.
2. **Given** a signed-out visitor views a protected service, **When** it renders, **Then** it is visibly obscured, cannot be focused, activated, selected, or announced by assistive technology, and exposes no destination.
3. **Given** a signed-out visitor viewing the services area activates the header "Log In" action, **When** sign-in completes, **Then** the visitor returns to the services area.
4. **Given** authentication is still resolving, **When** the services area renders, **Then** it shows the locked presentation until the visitor's status is known, with no layout shift when it unlocks.

---

### User Story 4 - Signed-in visitor keeps using the landing page (Priority: P4)

A signed-in student, manager, or administrator can still visit the public landing page, sees a direct path to their dashboard, and finds every service unlocked.

**Why this priority**: Signed-in visitors must not be redirected away or lose access to public content, and they must be able to return to their work quickly.

**Independent Test**: Load the landing page as each signed-in role and verify no forced redirect occurs, the header reports the correct dashboard destination, and all services are usable.

**Acceptance Scenarios**:

1. **Given** a signed-in visitor opens the home page, **When** the page loads, **Then** the landing page remains visible and no automatic redirect occurs.
2. **Given** a signed-in visitor views the header, **When** it renders, **Then** a "Dashboard" action is present and leads to the dashboard appropriate to that visitor's role.
3. **Given** a signed-in visitor views the services area, **When** it renders, **Then** every service is fully visible and usable.
4. **Given** a signed-in visitor activates "Get Started", **When** the action completes, **Then** the destination is the dashboard appropriate to that visitor's role.

---

### User Story 5 - Visitors navigate the page predictably (Priority: P5)

A visitor uses the header to move between sections, always knows which section is in view, and can navigate comfortably on a small screen or with a keyboard.

**Why this priority**: Navigation makes the long single-page experience usable and accessible, but the page still delivers value without perfect navigation polish.

**Independent Test**: Use header links, direct section addresses, the mobile menu, and keyboard-only navigation to reach every section and verify positioning, active indication, and focus behavior.

**Acceptance Scenarios**:

1. **Given** a visitor selects a header link, **When** the action completes, **Then** the matching section is positioned below the floating header and the address reflects the section.
2. **Given** a visitor scrolls through the page, **When** a new section becomes the main section in view, **Then** the matching header link is indicated as active by more than color alone.
3. **Given** a visitor opens a direct section address, **When** the page loads, **Then** the target section is positioned below the floating header.
4. **Given** a visitor on a narrow screen opens the header menu, **When** it opens, **Then** all section links and the authentication action are available, keyboard focus stays within the menu, and the rest of the page is excluded from interaction.
5. **Given** the menu is open, **When** the visitor presses Escape, activates the area outside the menu, or selects a section, **Then** the menu closes and focus returns to the menu control, or moves to the selected section when navigation occurs.

---

### Edge Cases

- Activity content arrives slowly: placeholders persist without a timeout error and without blocking the rest of the page.
- Activity content arrives after the visitor has left the section or page: no visible error or stale update occurs.
- Activity content is malformed, incomplete, or contains an unreadable date: unusable individual activities are omitted and usable ones still render; if every returned activity is unusable, the activity area shows the error outcome rather than broken cards.
- An activity title is very long: featured titles are limited to four lines and compact titles to three lines, with an ellipsis.
- An activity spans multiple days: the date and time presentation clearly shows both the start and end dates.
- An activity has no cover image or the image fails: a branded placeholder appears without changing card dimensions.
- An activity has no categories or no location: the corresponding line is omitted rather than showing empty punctuation.
- The data source supplies a single ordered list without featured and upcoming groups: all usable items are treated as upcoming and rendered in the featured-card style.
- The data source supplies a single list after the grouped placeholders were shown: the section may reflow into the featured-style grid without clipping, overlap, or horizontal scrolling.
- The hero visual fails: the hero keeps its layout and text remains readable over a solid fallback.
- The visitor's sign-in status cannot be resolved: the services area remains in the locked presentation and no protected destination is exposed.
- Only four of the six planned services are confirmed: the services area remains usable and no service is invented to fill the grid.
- A guide destination is not yet available: the card must not ship as a dead link; the destination is resolved or the card is presented as unavailable before release.
- The visitor requests reduced motion: section navigation is immediate and hover lift effects are not required.
- The viewport is 320 pixels wide: no horizontal scrolling occurs and all actions remain reachable.
- The visitor activates retry repeatedly: the area settles in one outcome without duplicate content or conflicting messages.
- A section address is opened before fonts and images finish loading: the target section is still positioned correctly.
- The mobile menu is open: page scrolling is locked, background content is unreachable, and closing the menu returns focus to the control that opened it.

## Requirements *(mandatory)*

### Functional Requirements

**Landing composition and access**

- **FR-001**: The home page MUST be publicly accessible to signed-out and signed-in visitors, with no forced redirect for signed-in visitors.
- **FR-002**: The page MUST present six content sections in this order: Hero, Platform Highlights, Featured and Upcoming Activities, HCMUS Services, Help and Guide, and Footer. A global header MUST float over the hero.
- **FR-003**: Each section MUST have a stable, shareable section address: home, about, activities, services, help, and contact.
- **FR-004**: A failure in activity discovery MUST NOT disable, hide, or degrade any other section.

**Header and navigation**

- **FR-005**: The header MUST show the myHCMUS brand, section links for Home, About Us, Activities, Services, and Help, and an authentication action.
- **FR-006**: The brand MUST return the visitor to the top of the landing page.
- **FR-007**: A signed-out visitor MUST see a "Log In" action that opens the sign-in experience. After successful sign-in, the visitor MUST return to the landing section they came from, or to the top of the landing page when no section was active.
- **FR-008**: A signed-in visitor MUST see a "Dashboard" action that opens the dashboard appropriate to that visitor's role.
- **FR-009**: While sign-in status is resolving, the header MUST reserve stable space for the authentication action and MUST NOT briefly show a signed-in-only action.
- **FR-010**: Selecting a section link MUST move the view smoothly to that section, offset for the floating header, and update the address to reflect the section. Browser back and forward navigation MUST restore the corresponding section position.
- **FR-011**: The header MUST indicate the section currently in view, using a cue in addition to color, and MUST expose the active link to assistive technology as the current section.
- **FR-012**: Opening a direct section address MUST position the target section below the floating header.
- **FR-013**: On viewports below 1024 pixels wide, the primary section links MUST collapse into a menu control. The opened menu MUST behave as a modal drawer (an overlay that captures interaction): it MUST contain the same links and authentication action, keep keyboard focus within the menu, exclude the rest of the page from interaction and assistive technology, lock page scrolling, and close on Escape, activation of the area outside the menu, or section selection. When it closes without navigation, focus MUST return to the menu control.

**Hero**

- **FR-014**: The hero MUST show the headline, supporting subtitle, a campus visual, and two actions: "Get Started" and "Explore the activities".
- **FR-015**: "Get Started" MUST open the sign-in experience for a signed-out visitor and, after successful sign-in, continue to the role-appropriate dashboard. For an already signed-in visitor, it MUST go directly to the role-appropriate dashboard.
- **FR-016**: "Explore the activities" MUST move the visitor to the activity section. The destination MUST remain a single configurable value so it can later point to a dedicated activity listing.
- **FR-017**: If the hero visual cannot be displayed, the hero MUST keep its layout and keep all text readable over a fallback background.

**Platform Highlights**

- **FR-018**: The highlights section MUST present exactly three highlights, each with an image, title, and description.
- **FR-019**: Highlights MUST be informational only and MUST NOT be presented as links.

**Featured and Upcoming Activities**

- **FR-020**: The activity section header MUST remain visible in every activity outcome.
- **FR-021**: Activity discovery MUST NOT block the first presentation of the rest of the page.
- **FR-022**: While activity content is loading, the section MUST show placeholders that match the expected grouped layout of two featured cards and three compact cards. If the data source supplies only a single list, the section MAY reflow into the single-list grid after loading, but the transition MUST NOT clip or overlap content or cause horizontal scrolling.
- **FR-023**: Loading activity content MUST be announced to assistive technology as a busy, updating area.
- **FR-024**: When the data source supplies explicit featured and upcoming groups, the section MUST show at most two featured activities and at most three compact activities; any additional items MUST be ignored.
- **FR-025**: When both featured and upcoming activities exist, featured cards MUST occupy the left area and compact cards MUST be stacked to the right.
- **FR-026**: When featured activities exist and no upcoming activities exist, featured cards MUST span the available width without an empty second column.
- **FR-027**: When no featured activities exist and upcoming activities exist, including when the data source supplies only a single ordered list, the upcoming activities MUST be presented in the featured card style in a responsive grid of up to five items and at most three columns.
- **FR-028**: When no activities exist at all, the section MUST show the empty outcome and MUST NOT show an empty grid.
- **FR-029**: A featured activity card MUST show a cover image, the title exactly as supplied, categories as a comma-separated line, date and time, location, registration status, and a "View" affordance.
- **FR-030**: A compact activity card MUST show a thumbnail, the title exactly as supplied, one category label (the first supplied category when more than one is present), date and time, and location, without a registration status.
- **FR-031**: Featured activity titles MUST be limited to four lines and compact titles to three lines, with an ellipsis when truncated.
- **FR-032**: Registration status MUST map to the labels "Registration Open", "Registration Upcoming", and "Registration Closed", each with a visible text label and a non-color-only indicator.
- **FR-033**: The whole activity card MUST be a single link to that activity's detail destination, and a signed-out visitor MUST be able to follow it; any sign-in requirement is handled on the detail destination. The "View" affordance MUST NOT be a separate link.
- **FR-034**: Activity date and time MUST be shown in 24-hour format as day/month/year and hour:minute, using the Asia/Ho_Chi_Minh timezone, for example `17/10/2026, 8:00 - 10:00`. A multi-day activity MUST show both start and end dates, for example `17/10/2026 8:00 - 18/10/2026 10:00`.
- **FR-035**: A missing or failed activity image MUST be replaced by a branded placeholder that preserves card dimensions.
- **FR-036**: Missing categories or missing location MUST cause the corresponding line to be omitted without leaving empty punctuation.
- **FR-037**: The empty outcome MUST state that no activities are available right now, explain that new activities will appear once announced, and reserve at least the height of one featured card row.
- **FR-038**: The error outcome MUST state that activities could not be loaded, advise the visitor to check the connection and try again, and offer a "Try again" action.
- **FR-039**: "Try again" MUST return the section to the loading presentation and MUST end in exactly one success, empty, or error outcome without duplicate content.
- **FR-040**: Individual activities missing required data MUST be omitted while usable activities continue to render. When every returned activity is unusable, or when the response as a whole cannot be interpreted, the section MUST show the error outcome instead of broken cards.

**HCMUS Services**

- **FR-041**: The services section MUST present six service entries arranged in three columns and two rows on wide viewports, each with an icon, name, and "Access" affordance.
- **FR-042**: Each service entry MUST be marked as either publicly available or requiring sign-in.
- **FR-043**: A signed-out visitor MUST be able to see and use every publicly available service.
- **FR-044**: A signed-out visitor MUST see services that require sign-in as visibly obscured, reduced in prominence, non-interactive, unreachable by keyboard, excluded from text selection, and hidden from assistive technology.
- **FR-045**: The signed-out presentation MUST NOT expose the destination of a service that requires sign-in.
- **FR-046**: The signed-out services presentation MUST rely on the header "Log In" action as its sign-in path and MUST NOT display a separate invitation over the obscured services.
- **FR-047**: While sign-in status is resolving, the section MUST show the locked presentation and MUST unlock without layout shift once the visitor is confirmed signed in.
- **FR-048**: A signed-in visitor MUST see every service fully visible and usable.
- **FR-049**: Every usable service link MUST have an accessible name and open in a new tab when the destination is external.
- **FR-050**: When fewer than six services are confirmed, the section MUST remain usable and MUST NOT invent service names, icons, or destinations. The final six entries are a release dependency.

**Help and Guide**

- **FR-051**: The help section MUST present four guide cards in two columns and two rows on wide viewports, each with an uppercase title, a short subtitle, and a trailing arrow.
- **FR-052**: The whole guide card MUST be one link to its configured guide destination, with a hover cue and a visible keyboard focus indicator.
- **FR-053**: Guide destinations MUST be configurable in one place. A card whose destination is not yet available MUST NOT ship as a dead link; the destination MUST be confirmed, redirected, or the card presented as unavailable, non-interactive, and excluded from keyboard and assistive-technology navigation before release.

**Footer**

- **FR-054**: The footer MUST contain a brand area with a one-line description, a contact area, a quick-links area reusing the header section links, and a bottom bar.
- **FR-055**: The bottom bar MUST show a copyright notice with the current year, derived at presentation time rather than fixed text.
- **FR-056**: Phone and email contact details MUST be actionable as telephone and email links.
- **FR-057**: Footer copy MUST be configurable in one place because final wording is still pending.

**Responsive behavior**

- **FR-058**: At 1024 pixels wide and above, the page MUST follow the wide layout: three highlight columns, a two-by-two guide grid, a three-by-two service grid, and, in the grouped presentation, two featured cards with a stack of three compact cards.
- **FR-059**: Between 640 and 1023 pixels wide, the header MUST use its menu presentation, the highlights and services grids MUST use two columns, the guide grid MUST keep two columns, and the activity area MUST reflow without clipping: featured activities use a two-column grid and compact activities form a two-column stack below.
- **FR-060**: Below 640 pixels wide, highlights, services, and guides MUST use a single column, hero actions MUST stack at full width, and compact activity cards MUST keep their horizontal presentation.
- **FR-061**: The page MUST avoid horizontal scrolling at any width from 320 to 1920 pixels.
- **FR-062**: Interactive targets MUST be at least 44 by 44 pixels on touch screens, and the header menu and obscured services MUST remain usable at narrow widths.

**Accessibility**

- **FR-063**: The page MUST use semantic landmarks for the header, main content, sections, and footer, with exactly one top-level heading, section titles as second-level headings, and card titles as third-level headings.
- **FR-064**: Every interactive element MUST be operable by keyboard in a logical order and MUST show a visible focus indicator.
- **FR-065**: Content images MUST have a meaningful text alternative; purely decorative images and shapes MUST be hidden from assistive technology.
- **FR-066**: Text and meaningful indicators MUST meet WCAG 2.1 AA contrast, including the hero headline over the campus visual and white text over deep blue.
- **FR-067**: When the visitor requests reduced motion, section navigation MUST be immediate and hover movement MUST be suppressed while state changes remain clear.
- **FR-068**: Loading, empty, and error outcomes MUST be announced to assistive technology without moving focus unexpectedly, and focus MUST NOT be dropped to the page start when an outcome replaces the loading presentation.
- **FR-069**: Obscured services and the opened mobile menu MUST NOT be reachable or announced when they are not available to the visitor. While the modal drawer is open, the rest of the page MUST be excluded from keyboard and assistive-technology navigation; when it closes, focus MUST return to the menu control.
- **FR-070**: Status MUST NOT be conveyed by color alone; text labels MUST accompany status indicators.

**Content, performance, and sharing**

- **FR-071**: Visible interface copy MUST be in English. Activity titles and other activity content MUST be preserved as supplied, including Vietnamese text, and MUST NOT be transformed in case by the page.
- **FR-072**: Section copy, navigation labels, highlights, services, guides, and footer content MUST each come from a single configurable source rather than being scattered through the presentation.
- **FR-073**: The landing page MUST expose a page title, description, and social sharing preview for the public home page.
- **FR-074**: The hero visual MUST be presented as early as practical, while below-the-fold imagery MUST NOT delay the first presentation of the page.
- **FR-075**: Images and placeholders MUST reserve their dimensions so that content arriving later does not shift the layout.

### Key Entities

- **Visitor**: A person viewing the landing page, either signed out or signed in. Signed-in visitors have a role (student, manager, or administrator) that determines their dashboard destination.
- **Activity**: A discoverable extracurricular opportunity with an identifier, title, cover image, categories, start and end time, location, registration status, and detail destination. An activity is usable only when it has an identifier (from which its detail destination is formed), title, start time, end time, and registration status; cover image, categories, and location are optional and may be absent.
- **Activity Collection**: The featured and upcoming activities supplied for the landing page. The collection may provide explicit featured and upcoming groups or a single ordered list. The landing page displays at most two featured and three upcoming items when groups are explicit, or up to five items in the featured-card style when only a single list is supplied.
- **Navigation Link**: A labeled section destination shown in the header and footer, with an active state based on the section in view.
- **Highlight**: A static benefit statement with an image, title, and description.
- **Service Entry**: A university service with an icon, name, destination, and an access level of public or requiring sign-in.
- **Guide Entry**: A help topic with a title, subtitle, and destination.
- **Footer Content**: Brand description, contact details, quick links, and copyright information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90 percent of first-time visitors in usability testing can state the platform's purpose and locate the sign-in action within 15 seconds of the page becoming visible.
- **SC-002**: The activity section reaches a terminal outcome (populated, empty, or error) within 3 seconds for at least 95 percent of visits on a 10 Mbps connection, with placeholders shown immediately.
- **SC-003**: In the grouped presentation, the activity section causes no measurable layout shift when content replaces placeholders; the single-list fallback causes no clipping, overlap, or horizontal scrolling.
- **SC-004**: All four activity outcomes can be reproduced and visually verified using controlled test content before release.
- **SC-005**: A signed-out visitor can reach and activate zero services that require sign-in, verified across keyboard, pointer, and assistive-technology use.
- **SC-006**: At least 90 percent of signed-out visitors in usability testing understand that the obscured services require an account and can locate the header sign-in action.
- **SC-007**: A signed-in visitor reaches the dashboard appropriate to their role in one action from the header.
- **SC-008**: Automated accessibility checks report zero critical violations, and every interactive element is reachable and operable by keyboard alone.
- **SC-009**: The page remains fully usable with no horizontal scrolling at every width from 320 to 1920 pixels.
- **SC-010**: A failure in activity discovery leaves 100 percent of the other sections navigable and usable in the same visit.
- **SC-011**: All confirmed interface text passes contrast checks at WCAG 2.1 AA, including the hero headline and white-on-blue content.
- **SC-012**: At least 95 percent of visitors can navigate from the header to any section on the first attempt, on both wide and narrow screens.

## Assumptions

- Activity content is supplied by a backend capability owned by a separate team. Its final contract is not confirmed, so this specification defines the required visitor-visible behavior and data meaning rather than any request or response contract. The drafts in the source design document are proposals only.
- Activity content may provide explicit featured and upcoming groups or a single ordered list. When only a list is supplied, the page treats all usable items as upcoming and does not infer featured prominence from order.
- Loading placeholders follow the expected grouped layout. When only a single list is supplied, the section may reflow after loading because the data shape is unknown while loading; that reflow is an accepted tradeoff and must remain free of clipping, overlap, and horizontal scrolling.
- The activity detail destination is publicly viewable; registration is assumed to require sign-in. This must be confirmed with the product owner.
- The dedicated activity listing and help pages are outside this feature. The hero action currently targets the on-page activity section, and help cards target configured help destinations.
- The page is English-only. Activity content is displayed exactly as supplied and may be Vietnamese.
- Sign-in is handled by the existing authentication experience and is outside this feature. The landing page only links to it and reflects its state.
- Sign-in return behavior is intent-based: "Get Started" continues to the role dashboard, while the header "Log In" action returns the visitor to the landing location they came from, including the services section when sign-in starts there.
- Signed-in visitors are identified, and their role determines the dashboard destination. This capability already exists in the product.
- The two unnamed service entries, final hero wording, and final footer copy are pending product input. The feature must not invent them; the layout must remain usable until they are supplied.
- The services section does not display a separate sign-in invitation. This follows the UI reference; the obscured cards remain inert and the header "Log In" action is the sign-in path for guests.
- The desktop design is the visual source of truth. The 1024-pixel and 640-pixel breakpoints, two-column intermediate layout, and single-column narrow layout are reasonable defaults inferred from the design and must be validated. The tablet activity reflow (two-column featured grid with compact cards below) is also a default to validate.
- Visitors use modern evergreen browsers.
- External university services are third-party destinations. The landing page only links to them and does not control their availability.
- Obscuring a protected service is a user-experience cue, not a security control. Protected destinations are not secrets, but they are still not exposed in the signed-out presentation.
- The current year used in the footer is derived when the page is presented.
- Visual styling such as colors, spacing, typography, image treatments, and decorative shapes follows the UI reference and the project design system. This specification defines visitor-visible behavior, content, and states rather than visual values.
- No additional product features beyond the six sections and their stated interactions are in scope.

## Open Questions

These items do not block specification but must be resolved before release or before the relevant content is published.

1. What are the final names and icons for the two remaining university services?
2. Should the hero headline read "Grown." as designed or "Grow." as likely intended?
3. Are the help destinations available at release? If not, should the guide cards be hidden, redirected, or presented as unavailable?
4. What is the final footer copy, including contact details and hotlines?
5. What is the confirmed activity data contract, including field names and whether featured and upcoming groups are supplied explicitly?
