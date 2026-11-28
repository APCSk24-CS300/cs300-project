# Contract: University Services Hub API

**Base**: `http://localhost:8080/api/v1` (backend). The browser reaches it through `/api/backend/*` on the Next.js app (research R-01).

**Source of truth**: `docs/api/openapi.yaml` v1.2.0, tag "University Services Hub". This file lists only what the implementation adds or decides on top of it. Each difference is also to be logged in `docs/api/openapi-changes.md`.

## Envelope (research R-02)

Success:

```json
{ "success": true, "statusCode": 200, "payload": { "message": "OK (OK)", "data": <body> } }
```

Error:

```json
{ "success": false, "statusCode": 400, "payload": { "message": "Validation failed (BAD_REQUEST)",
  "data": { "details": [ { "field": "url", "code": "INVALID_URL", "message": "Use a full http:// or https:// address" } ] } } }
```

Clients branch on the HTTP status and `details[].code`, never on `message`.

## Middleware order for every route

`validateMethod` → `validateAccessToken` (401) → `requirePermission(code)` (403/503) → `validateContentType` (POST/PATCH only, 415) → controller.

## Endpoints

### `GET /hub/services`  — permission `hub.services.read`

200 `data: UniversityService[]`, active only, ordered `displayOrder, lower(name), id`. Empty array when none (UC-07 A1).

### `GET /hub/services/{serviceId}`  — `hub.services.read`

200 `data: UniversityService` · 404 if missing, inactive, or `serviceId` not a positive integer.

### `GET /admin/services?includeInactive=true`  — `hub.services.manage`

200 `data: UniversityService[]`, same order. `includeInactive` defaults to `true`; any value other than `true`/`false` → 400.

### `POST /admin/services`  — `hub.services.manage`

Body `CreateServiceLinkRequest` + optional `reason` (string ≤ 200).
201 `data: UniversityService` + `ETag: "1"` + `Location: /api/v1/admin/services/{id}` · 400 validation · **409 `DUPLICATE_VALUE`** on name (added; not in OpenAPI create responses).

### `PATCH /admin/services/{serviceId}`  — `hub.services.manage`

Header `If-Match: "<version>"` optional. Body `UpdateServiceLinkRequest` + optional `reason`; at least one known field.
200 `data` + new `ETag` · 400 · 404 · 409 name · 412 `PRECONDITION_FAILED` stale version. A body that changes nothing returns 200 with the current link and writes no audit row.

### `DELETE /admin/services/{serviceId}`  — `hub.services.manage`

Header `If-Match` optional. Sets `isActive=false`.
200 `data: UniversityService` (contract says `MessageSuccess`; returning the link too lets the FE update its row without a reload) · 404 · 412. Already inactive → 200, no audit row.

## Validation codes (`details[].code`)

| field | code | rule |
| --- | --- | --- |
| name | `REQUIRED`, `TOO_LONG` | trimmed, 1–100 |
| url | `REQUIRED`, `INVALID_URL`, `TOO_LONG` | absolute `http`/`https`, no credentials, no whitespace, ≤ 2048 |
| description | `TOO_LONG`, `INVALID_TYPE` | string ≤ 500 or null; empty string → null |
| displayOrder | `INVALID_TYPE`, `OUT_OF_RANGE` | integer 0–9999 |
| isActive | `INVALID_TYPE` | boolean |
| reason | `TOO_LONG` | ≤ 200 |
| (body) | `EMPTY_UPDATE`, `UNKNOWN_FIELD` | PATCH needs ≥ 1 known field; unknown fields rejected |

## Status summary

| Status | When |
| --- | --- |
| 401 | no / bad / expired bearer token |
| 403 | caller lacks the permission, or account deactivated |
| 404 | unknown or (hub only) inactive service |
| 405 | wrong method |
| 409 | duplicate name |
| 412 | `If-Match` does not match current version |
| 415 | POST/PATCH without `application/json` |
| 503 | database unreachable |

## BFF route (frontend, `src/client/src/app/api/backend/[...path]/route.ts`)

- Forwards to `${BACKEND_API_URL}/${path}` with method, query, JSON body, `If-Match`.
- Adds `Authorization: Bearer ${DEV_BACKEND_TOKEN}` (dev only, see research R-01); no token ⇒ answers 401 itself without calling the backend.
- Returns backend status, body and `ETag` unchanged. Network failure ⇒ 502 with the same envelope.
- Allows only paths starting with `hub/` or `admin/services` (no open proxy).
