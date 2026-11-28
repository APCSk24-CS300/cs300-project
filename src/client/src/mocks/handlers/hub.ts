import { http, type HttpResponseResolver } from "msw";
import { HUB_MANAGE, HUB_READ } from "@/mocks/db/seed";
import { updateDb } from "@/mocks/db/store";
import type { MockDb, MockServiceLink } from "@/mocks/db/types";
import { delay } from "@/mocks/utils/latency";
import { apiUrl, permissionsOf } from "@/mocks/utils/shape";
import { hubFail, hubOk } from "@/mocks/utils/service-response";
import {
  DISPLAY_ORDER_MAX,
  parseIfMatch,
  parseServiceId,
  validateCreate,
  validateUpdate,
  type ServiceLinkInput,
} from "@/mocks/utils/service-link-validation";
import { withAuth, withFailureSwitch, type AuthContext } from "@/mocks/handlers/guards";

/**
 * University Services Hub (UC-07) and its administration, answering like src/server HubRoute /
 * HubController (specs 004 contracts/hub-api.md):
 *   method → token → permission → content type → controller.
 * Token and account checks reuse `withAuth` (the Authentication group's middleware, 003 DOC-01/DOC-06);
 * everything after it uses the backend's ServiceResponse envelope (DOC-16).
 */

const NOT_FOUND = "This university service does not exist or is no longer available";
const STALE = "The resource was changed by someone else, reload it and try again";
const DUPLICATE = "A service with this name already exists";

type Info = Parameters<HttpResponseResolver>[0];
type Resolver = (info: Info, ctx: AuthContext) => Promise<Response>;

/** Permission check (requirePermission): 403 in the hub envelope. */
function requirePermission(code: string, resolver: Resolver) {
  return withAuth(async (info, ctx) => {
    if (!permissionsOf(ctx.db, ctx.user).includes(code)) {
      return hubFail(403, "You do not have permission to perform this action");
    }
    return resolver(info, ctx);
  });
}

/** POST/PATCH need `application/json` (validateContentType → 415). */
function isJson(request: Request): boolean {
  return (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase() === "application/json";
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

/** Hub order: display order, then lower-case name, then id. */
function hubOrder(a: MockServiceLink, b: MockServiceLink): number {
  return (
    a.displayOrder - b.displayOrder ||
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
    Number(a.id) - Number(b.id)
  );
}

function sorted(links: MockServiceLink[]): MockServiceLink[] {
  return [...links].sort(hubOrder).map((l) => ({ ...l }));
}

const etag = (link: MockServiceLink) => ({ ETag: `"${link.version}"` });

function nameTaken(db: MockDb, name: string, exceptId?: string): boolean {
  const key = name.trim().toLowerCase();
  return db.serviceLinks.some((l) => l.id !== exceptId && l.name.trim().toLowerCase() === key);
}

type ChangeOutcome =
  | { kind: "ok" | "unchanged"; link: MockServiceLink }
  | { kind: "not_found" }
  | { kind: "stale"; current: MockServiceLink }
  | { kind: "duplicate" };

/** HubService.update: version check, no-op detection, duplicate name, version + 1. */
function applyChange(id: string, input: ServiceLinkInput, expected: number | null): ChangeOutcome {
  return updateDb<ChangeOutcome>((db) => {
    const current = db.serviceLinks.find((l) => l.id === id);
    if (!current) return { kind: "not_found" };
    if (expected !== null && expected !== current.version) return { kind: "stale", current: { ...current } };
    const next = {
      name: input.name ?? current.name,
      url: input.url ?? current.url,
      description: input.description !== undefined ? input.description : current.description,
      displayOrder: input.displayOrder ?? current.displayOrder,
      isActive: input.isActive ?? current.isActive,
    };
    const changed = (Object.keys(next) as (keyof typeof next)[]).some((k) => next[k] !== current[k]);
    if (!changed) return { kind: "unchanged", link: { ...current } };
    if (next.name !== current.name && nameTaken(db, next.name, id)) return { kind: "duplicate" };
    Object.assign(current, next, { version: current.version + 1 });
    return { kind: "ok", link: { ...current } };
  });
}

function sendChange(outcome: ChangeOutcome) {
  switch (outcome.kind) {
    case "ok":
    case "unchanged":
      return hubOk(outcome.link, 200, etag(outcome.link));
    case "not_found":
      return hubFail(404, NOT_FOUND);
    case "stale":
      return hubFail(412, STALE, { currentVersion: outcome.current.version });
    case "duplicate":
      return hubFail(409, DUPLICATE, [{ field: "name", code: "DUPLICATE_VALUE", message: DUPLICATE }]);
  }
}

export const hubHandlers = [
  /** GET /hub/services — active links in hub order (hub.services.read). */
  http.get(
    apiUrl("/hub/services"),
    withFailureSwitch(
      "listServices",
      requirePermission(HUB_READ, async (_info, { db }) => {
        await delay();
        return hubOk(sorted(db.serviceLinks.filter((l) => l.isActive)));
      }),
    ),
  ),

  /** GET /hub/services/{serviceId} — 404 when unknown, inactive or not a positive integer. */
  http.get(
    apiUrl("/hub/services/:serviceId"),
    withFailureSwitch(
      "listServices",
      requirePermission(HUB_READ, async ({ params }, { db }) => {
        await delay();
        const id = parseServiceId(params.serviceId);
        const link = id ? db.serviceLinks.find((l) => l.id === id && l.isActive) : undefined;
        return link ? hubOk({ ...link }) : hubFail(404, NOT_FOUND);
      }),
    ),
  ),

  /** GET /admin/services?includeInactive=true|false (hub.services.manage). */
  http.get(
    apiUrl("/admin/services"),
    withFailureSwitch(
      "manageServiceLinks",
      requirePermission(HUB_MANAGE, async ({ request }, { db }) => {
        await delay();
        const raw = new URL(request.url).searchParams.get("includeInactive");
        if (raw !== null && raw !== "true" && raw !== "false") {
          return hubFail(400, "Invalid query", [{ field: "includeInactive", code: "INVALID_TYPE", message: "Use true or false" }]);
        }
        return hubOk(sorted(raw === "false" ? db.serviceLinks.filter((l) => l.isActive) : db.serviceLinks));
      }),
    ),
  ),

  /** POST /admin/services — 201 + ETag + Location; placed last when no order is given. */
  http.post(
    apiUrl("/admin/services"),
    withFailureSwitch(
      "manageServiceLinks",
      requirePermission(HUB_MANAGE, async ({ request }) => {
        await delay();
        if (!isJson(request)) return hubFail(415, "Content-Type must be application/json");
        const result = validateCreate(await readJson(request));
        if (!result.ok) return hubFail(400, "Invalid service link", result.errors);
        const input = result.value;
        const created = updateDb<MockServiceLink | null>((db) => {
          if (nameTaken(db, input.name!)) return null;
          const maxOrder = db.serviceLinks.reduce((max, l) => Math.max(max, l.displayOrder), -1);
          const link: MockServiceLink = {
            id: String(db.nextServiceLinkId++),
            name: input.name!,
            url: input.url!,
            description: input.description ?? null,
            displayOrder: input.displayOrder ?? Math.min(maxOrder + 1, DISPLAY_ORDER_MAX),
            isActive: input.isActive ?? true,
            version: 1,
          };
          db.serviceLinks.push(link);
          return { ...link };
        });
        if (!created) return hubFail(409, DUPLICATE, [{ field: "name", code: "DUPLICATE_VALUE", message: DUPLICATE }]);
        return hubOk(created, 201, { ...etag(created), Location: `/api/v1/admin/services/${created.id}` });
      }),
    ),
  ),

  /** PATCH /admin/services/{serviceId} — If-Match optional; also reactivates (isActive: true). */
  http.patch(
    apiUrl("/admin/services/:serviceId"),
    withFailureSwitch(
      "manageServiceLinks",
      requirePermission(HUB_MANAGE, async ({ request, params }) => {
        await delay();
        if (!isJson(request)) return hubFail(415, "Content-Type must be application/json");
        const id = parseServiceId(params.serviceId);
        if (!id) return hubFail(404, NOT_FOUND);
        const version = parseIfMatch(request.headers.get("If-Match"));
        const result = validateUpdate(await readJson(request));
        if (!result.ok) return hubFail(400, "Invalid service link", result.errors);
        if (version === "invalid") return hubFail(412, STALE);
        return sendChange(applyChange(id, result.value, version));
      }),
    ),
  ),

  /** DELETE /admin/services/{serviceId} — soft: isActive=false; already inactive = 200 no-op. */
  http.delete(
    apiUrl("/admin/services/:serviceId"),
    withFailureSwitch(
      "manageServiceLinks",
      requirePermission(HUB_MANAGE, async ({ request, params }) => {
        await delay();
        const id = parseServiceId(params.serviceId);
        if (!id) return hubFail(404, NOT_FOUND);
        const version = parseIfMatch(request.headers.get("If-Match"));
        if (version === "invalid") return hubFail(412, STALE);
        return sendChange(applyChange(id, { isActive: false }, version));
      }),
    ),
  ),
];
