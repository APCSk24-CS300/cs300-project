# Contract: Activity Service and Hook

**Feature**: `001-landing-page` | **Status**: Planned

The activity feature exposes one data operation through a TypeScript service contract. The real and mock implementations are interchangeable at a single selection point. Components and hooks consume domain models only.

## Service Interface

```ts
// features/activities/services/activity.service.ts
export interface ActivityService {
  getLandingActivities(signal?: AbortSignal): Promise<LandingActivities>;
}
```

### Method contract

`getLandingActivities(signal?)`:

- Resolves with a display-ready `LandingActivities` domain collection.
- Rejects when the request fails, the response is malformed, or raw items were supplied but none are usable.
- Honors `signal` by aborting the underlying request.
- Does not expose DTOs, the response envelope, or HTTP status details to callers.

## Implementations

### RealActivityService

- Calls `api.get<LandingActivitiesResponseDTO>("/activities/landing", { signal })`.
- Passes `response.data` to `mapLandingActivitiesDTO`.
- Returns the mapped domain collection.
- Does not call `fetch` directly.
- Does not construct a base URL.
- Does not handle auth headers; the public endpoint requires none.

### MockActivityService

- Implements the same interface and returns domain values through the same mapper used by the real service.
- Uses deterministic DTO fixtures.
- Simulates a short latency and supports cancellation.
- Supports these scenarios:
  - `success`: grouped data with 2 featured and 3 upcoming.
  - `partial`: grouped data containing some invalid items alongside usable items.
  - `empty`: a valid 200 response with no activities.
  - `error`: a rejected request with a normalized error.
  - `delay`: a slow request for loading-state verification.
  - `single-list`: a valid single ordered list with 3–5 items.
  - `all-invalid`: raw items supplied but none usable, producing the error outcome.
  - `long-content`: long titles, missing optional fields, a multi-day activity, and an image failure for edge-case QA.

- Scenario selection for manual QA uses `NEXT_PUBLIC_MOCK_ACTIVITY_SCENARIO`; tests inject the mock or a deferred fake directly.

## Selection Point

```ts
// features/activities/services/activity.service.factory.ts
export function createActivityService(): ActivityService;
```

- This is the only production module that imports both implementations.
- `src/libs/service-mode.ts` reads `NEXT_PUBLIC_DATA_SOURCE`.
- `mock` is the default until the backend contract is confirmed.
- `api` selects the real implementation.
- No component or hook imports `MockActivityService` directly.

## Hook Contract

```ts
// features/activities/hooks/useLandingActivities.ts
export type LandingActivitiesStatus =
  | "loading"
  | "success"
  | "empty"
  | "error";

export type UseLandingActivitiesResult =
  | {
      status: "loading";
      data: null;
      error: null;
      refetch: () => void;
    }
  | {
      status: "success";
      data: LandingActivities;
      error: null;
      refetch: () => void;
    }
  | {
      status: "empty";
      data: LandingActivities;
      error: null;
      refetch: () => void;
    }
  | {
      status: "error";
      data: null;
      error: Error;
      refetch: () => void;
    };

export function useLandingActivities(): UseLandingActivitiesResult;
```

### Hook behavior

- Starts in `loading` on mount.
- Calls `createActivityService().getLandingActivities(signal)`.
- Treats a successful collection with no items as `empty`.
- Treats service and mapping failures as `error`.
- `refetch()` aborts the previous request and returns to `loading`.
- Aborts on unmount.
- Ignores aborted requests and responses from older request ids.
- Never throws during render; errors are represented in the state.
- Does not log raw sensitive payloads.

### Test injection

For tests, the hook may accept an optional service argument:

```ts
export function useLandingActivities(
  service?: ActivityService,
): UseLandingActivitiesResult;
```

The default remains `createActivityService()`. Production call sites pass nothing. Tests pass a fake/deferred service to control timing and outcomes without environment variables.

## Domain Types

The service returns:

```ts
type LandingActivities = {
  featured: Activity[];
  upcoming: Activity[];
};
```

- `featured` is explicit-group featured content only; it is empty for single-list responses.
- `upcoming` is either explicit-group upcoming content or single-list content.
- Invalid items are removed.
- Display caps are applied after filtering: grouped → 2 featured / 3 upcoming; single list → 5 upcoming.
- No DTO fields (`image_url`, `start_time`, `registration_status`) reach the hook or UI.

## Error Semantics

| Failure | Service result | Hook state |
|---------|----------------|------------|
| Network error | rejects with normalized `Error` | error |
| 5xx | rejects with normalized `Error` | error |
| Malformed payload | rejects with `InvalidLandingActivitiesError` (`INVALID_PAYLOAD`) | error |
| Raw items but all invalid | rejects with `InvalidLandingActivitiesError` (`NO_USABLE_ITEMS`) | error |
| Valid 200 with no items | resolves with empty collection | empty |
| Aborted request | rejects with an abort error; caller ignores it | no visible change |

The UI never displays the raw error message. It displays the fixed activity error copy and a Try again action.

## Behavioral Compatibility Checklist

The mock and real implementations must both satisfy:

- Same method signature and return type.
- Same empty/success/error semantics.
- Same cancellation behavior.
- Same mapper boundary and domain shape.
- No DTO leakage.
- No environment-specific branching inside consumers.
- No production import of the mock except through the factory.
