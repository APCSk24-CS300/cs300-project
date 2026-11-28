---
description: Pages and features available to students for discovering activities, managing participation, and tracking training scores.
role: Student
---

# Student Pages

## Dashboard

## Activities

## My Registrations

## DRS Management

## Calendar

## AI Student Assistant

## University Services

Route: `/services` (every signed-in role; also linked from the role navigation and the landing page).

- Shows the active university service links (Moodle, Student Portal, Tuition Payment, ...) in the order administrators set, each with its name and description.
- Selecting a card opens the service in a new tab (`noopener noreferrer`); myHCMUS does not share data with it (BR-NOT-06).
- States: loading skeleton, empty state when no link is configured (UC-07 A1), retryable error when loading fails (UC-07 A4).
- Data: `GET /api/v1/hub/services` through the frontend's `/api/backend` forwarder. Administrators manage the links at `/admin/services`.
- Spec: `src/specs/004-university-service-hub/`.

