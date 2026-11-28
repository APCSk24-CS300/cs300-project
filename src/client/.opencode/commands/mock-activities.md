---
description: Switch the mock activities service to a scenario (full, partial, empty, error, slow)
agent: build
---

Make the mock activities service return the scenario: "$ARGUMENTS".

Valid scenarios:
- `full`: 2 featured + 3 upcoming (mix of registration statuses `open`, `upcoming`, `closed`; one item without an image; one with a very long title; one multi-day activity)
- `partial`: 1 featured + 0 upcoming
- `upcoming-only`: 0 featured + 3 upcoming
- `empty`: both lists empty (successful response)
- `error`: reject with an Error
- `slow`: `full` data after a 3 second delay

Context:
- File: `features/activities/services/mock.activity.service.ts`; it must implement the same interface as `activity.service.ts` (see section 7.3 of @docs/landing-page-spec.md).
- Prefer selecting the scenario with an environment variable (e.g. `NEXT_PUBLIC_MOCK_ACTIVITIES_SCENARIO`, default `full`) instead of editing code each time. Reuse the repo's existing mechanism for choosing mock vs real services (see how auth does it); do not add a second one.
- If "$ARGUMENTS" is empty or invalid, list the valid scenarios and stop.

Return mock data in the DTO shape, not the UI model, so the real mapper is exercised. Tell me what to set in `.env.local` to see the scenario.
