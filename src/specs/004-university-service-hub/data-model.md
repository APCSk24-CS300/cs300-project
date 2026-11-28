# Data Model: University Services Hub

**Feature**: 004-university-service-hub | **Date**: 2026-11-27

## Database (PostgreSQL)

### ServiceLink (existing, `src/db/schema.sql`), changed by migration `src/db/hub_schema.sql`

| Column | Type | Rule | Change |
| --- | --- | --- | --- |
| `service_id` | `BIGINT` identity PK | | existing |
| `name` | `TEXT NOT NULL UNIQUE` | trimmed, non-empty, ≤ 100 | existing; add unique index on `lower(btrim(name))` |
| `url` | `TEXT NOT NULL` | `http(s)://`, ≤ 2048 | existing; add `CHECK (url ~* '^https?://' AND length(url) <= 2048)` |
| `description` | `TEXT NULL` | ≤ 500 | existing; add length check |
| `display_order` | `INT NOT NULL DEFAULT 0` | 0–9999 | existing; add range check |
| `is_active` | `BOOLEAN NOT NULL DEFAULT TRUE` | | existing |
| `version` | `INT NOT NULL DEFAULT 1` | +1 on every update | **new** |

Migration notes (constitution V, "consider existing data"): every change is additive. Before adding the checks the migration runs a `DO` block that raises a clear error listing rows that would fail, instead of failing midway. Existing rows get `version = 1`.

Index: `CREATE INDEX service_link_active_order ON "ServiceLink" (is_active, display_order, lower(name))` for the hub list.

### Permission / RolePermission (existing)

| permission_id | code | Roles |
| --- | --- | --- |
| 910 | `hub.services.read` | student, manager, administrator |
| 911 | `hub.services.manage` | administrator |

### AuditLog (existing, unchanged)

One row per successful admin change:

| Field | Value |
| --- | --- |
| `actor_user_id` | token `sub` |
| `entity_type` | `ServiceLink` |
| `entity_id` | `service_id` as text |
| `action` | `service_link.create` / `.update` / `.deactivate` / `.reactivate` |
| `reason` | request `reason`, else the action name |
| `before_values` | full row before (null on create) |
| `after_values` | full row after |

### Seed

The hub has six links, agreed with the team. `seed.sql` (now on `dev`, from PR #103) inserts "HCMUS" and "Student Portal" without `ON CONFLICT`, so `hub_schema.sql` never inserts those names. It updates those two rows in place, and only while they still hold `seed.sql`'s original values, so a re-run never overwrites an admin's edits. It inserts the other five with `ON CONFLICT DO NOTHING`.

| display_order | name | url | is_active | row from |
| --- | --- | --- | --- | --- |
| 1 | Moodle | https://courses.ctda.hcmus.edu.vn/ | true | hub_schema.sql |
| 2 | Student Portal | https://student.hcmus.edu.vn/login | true | seed.sql, URL updated by hub_schema.sql |
| 3 | Course Registration Portal | https://new-portal4.hcmus.edu.vn/Login.aspx | true | hub_schema.sql |
| 4 | Special Programs Portal | https://portal.ctdb.hcmus.edu.vn/Login | true | hub_schema.sql |
| 5 | Tuition Payment | https://hocphi.hcmus.edu.vn/ | true | hub_schema.sql |
| 6 | Student Handbook 2025 | https://hcmus.edu.vn/wp-content/uploads/2025/08/STSV2025_ONLINE.pdf | true | hub_schema.sql |
| 7 | HCMUS | https://hcmus.edu.vn | false | seed.sql, deactivated by hub_schema.sql |

Run `hub_schema.sql` after `seed.sql`. Hub permissions are granted to existing roles only, and the two `seed.sql` rows can only be updated once they exist; if `hub_schema.sql` ran first, run it again afterwards.

## Backend types (`src/server/src/types/ServiceLink.ts`)

```ts
interface ServiceLink {          // API shape, camelCase (contract UniversityService)
  id: string;                    // service_id as string
  name: string;
  description: string | null;
  url: string;
  displayOrder: number;
  isActive: boolean;
  version: number;
}
interface CreateServiceLinkInput { name: string; url: string; description?: string | null;
  displayOrder?: number; isActive?: boolean; reason?: string }
type UpdateServiceLinkInput = Partial<CreateServiceLinkInput>; // at least one field
interface ServiceLinkStore {     // implemented by ServiceLinkRepository (pg) and FakeServiceLinkStore (tests)
  listActive(): Promise<ServiceLink[]>;
  listAll(includeInactive: boolean): Promise<ServiceLink[]>;
  findById(id: string): Promise<ServiceLink | null>;
  create(input, actorId): Promise<ServiceLink>;                     // + audit, one transaction
  update(id, input, expectedVersion | null, actorId): Promise<UpdateResult>; // + audit
}
type UpdateResult = { kind: 'ok', link } | { kind: 'not_found' } | { kind: 'stale' } | { kind: 'unchanged', link };
```

Duplicate names surface from Postgres as `23505`; the repository maps them to a `DuplicateNameError`.

## Frontend types (`src/client/src/features/services/types/`)

```ts
// service.dto.ts — what the backend sends (inside payload.data)
type UniversityServiceDTO = { id: string; name: string; description: string | null; url: string;
  displayOrder: number; isActive: boolean; version: number };

// service.ts — what components use
type UniversityService = { id: string; name: string; description: string | null; href: string;
  icon: { src: string; alt: "" }; isActive: boolean; version: number };
```

The mapper drops items with a non-http(s) `url` (defence in depth) and sorts again by `displayOrder`, then name.

## State transitions

```
          create(isActive=true)                 create(isActive=false)
                 │                                      │
                 ▼          DELETE / PATCH isActive=false ▼
             [Active] ───────────────────────────────▶ [Inactive]
                 ▲                                      │
                 └────────── PATCH isActive=true ───────┘
```

No state leads to deletion.
