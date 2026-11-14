# Contract: Landing Activities HTTP API (Provisional)

**Status**: Unconfirmed backend contract. This document records the implementation assumption so the frontend can proceed with a mock and isolate a later change.

## Endpoint

```text
GET /activities/landing
```

- **Authentication**: Public. No auth header or session is required.
- **Purpose**: Return the activities to feature on the public landing page.
- **Base URL**: Resolved by `src/libs/api-client.ts`; features never construct URLs.
- **Abort**: The request must accept an `AbortSignal` through the API client.

## Response

```text
200 OK
Content-Type: application/json

{
  "data": <grouped-or-single-list>
}
```

### Grouped shape

```json
{
  "data": {
    "featured": [
      {
        "id": "act-001",
        "title": "HCMUS Science Camp 2026",
        "image_url": "https://media.example.edu/activities/act-001.jpg",
        "categories": ["Academic", "Science"],
        "start_time": "2026-10-17T08:00:00+07:00",
        "end_time": "2026-10-17T10:00:00+07:00",
        "location": "I.32, HCMUS",
        "registration_status": "open"
      }
    ],
    "upcoming": [
      {
        "id": "act-002",
        "title": "Campus Volunteer Day",
        "image_url": null,
        "categories": ["Community"],
        "start_time": "2026-10-20T07:30:00+07:00",
        "end_time": "2026-10-20T11:30:00+07:00",
        "location": null,
        "registration_status": "upcoming"
      }
    ]
  }
}
```

### Single-list shape

```json
{
  "data": {
    "activities": [
      {
        "id": "act-001",
        "title": "HCMUS Science Camp 2026",
        "image_url": null,
        "categories": [],
        "start_time": "2026-10-17T08:00:00+07:00",
        "end_time": "2026-10-18T10:00:00+07:00",
        "location": "I.32, HCMUS",
        "registration_status": "open"
      }
    ]
  }
}
```

## Field Contract

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Non-empty; used to form `/activities/{encodedId}` |
| `title` | string | Yes | Non-empty; preserve exactly as supplied, including Vietnamese |
| `image_url` | string \| null | No | Blank or `null` uses the branded placeholder |
| `categories` | string[] | No | Missing/blank entries are omitted from display |
| `start_time` | ISO 8601 string | Yes | Parseable date with timezone offset or `Z` |
| `end_time` | ISO 8601 string | Yes | Parseable date with timezone offset or `Z`; must not precede `start_time` |
| `location` | string \| null | No | Blank or `null` omits the location line |
| `registration_status` | `"open" \| "upcoming" \| "closed"` | Yes | Any other value makes the item unusable |

## Frontend Handling

- The real service unwraps `data` and passes it to `mapLandingActivitiesDTO`.
- In grouped mode, a missing `featured` or `upcoming` array is treated as an empty group.
- The mapper filters unusable items; if raw items were supplied but none are usable, it throws `InvalidLandingActivitiesError`.
- Grouped mode displays at most two featured and three compact activities.
- Single-list mode treats valid items as upcoming, displays at most five, and uses the featured card style.
- The frontend never displays raw server error text.
- 401/403 should not occur for this public endpoint; if either occurs, it is treated as the error outcome.
- A 204 or missing body is treated as an invalid payload, not as an empty collection.

## Error Responses

| Status | Frontend outcome |
|--------|------------------|
| 200 with valid data | success or empty |
| 200 with malformed shape | error |
| 200 with raw items but none usable | error |
| 401/403 | error |
| 404 | error (contract/implementation mismatch) |
| 5xx | error |
| Network failure/timeout | error |
| Aborted request | ignored; no visible state change |

## Example Error Shape

The frontend does not depend on the backend error body. The API client normalizes failures into an `Error`; the UI shows the fixed error copy and a Try again action.

```json
{
  "message": "Unable to load activities"
}
```

## Assumptions and Release Dependencies

1. The path `/activities/landing` is provisional.
2. The `{ "data": ... }` envelope is provisional.
3. The grouped and single-list shapes are provisional representations of the spec's two allowed data organizations. A response containing both shapes, or neither, is treated as an invalid payload.
4. The field names and casing are provisional; only the mapper and DTO should change if they differ.
5. The media host for `image_url` is unknown. Mock mode uses local assets. Real mode requires a confirmed host in `images.remotePatterns`; do not use a broad allowlist.
6. The activity detail route `/activities/{id}` is assumed public for viewing; registration is handled by the detail destination.
7. The endpoint is assumed public and unauthenticated.
