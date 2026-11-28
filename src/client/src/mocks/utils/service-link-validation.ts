import type { HubFieldError } from "@/mocks/utils/service-response";

/**
 * Mirrors src/server/src/helper/validateServiceLinkRequest.ts (same rules, codes and messages), so the
 * mock rejects exactly what the backend rejects. The frontend form has its own zod pre-check.
 */
export const NAME_MAX = 100;
export const URL_MAX = 2048;
export const DESCRIPTION_MAX = 500;
export const REASON_MAX = 200;
export const DISPLAY_ORDER_MAX = 9999;

const FIELDS = ["name", "url", "description", "displayOrder", "isActive", "reason"];
const CHANGE_FIELDS = ["name", "url", "description", "displayOrder", "isActive"] as const;

export interface ServiceLinkInput {
  name?: string;
  url?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export type ValidationResult = { ok: true; value: ServiceLinkInput } | { ok: false; errors: HubFieldError[] };

export function isSafeServiceUrl(url: string): boolean {
  if (url.length === 0 || url.length > URL_MAX || /\s/.test(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (parsed.username !== "" || parsed.password !== "") return false;
  return parsed.hostname !== "";
}

function checkName(value: unknown, errors: HubFieldError[]): string | undefined {
  if (typeof value !== "string") {
    errors.push({ field: "name", code: value === undefined || value === null ? "REQUIRED" : "INVALID_TYPE", message: "Enter a name" });
    return undefined;
  }
  const name = value.trim();
  if (name === "") errors.push({ field: "name", code: "REQUIRED", message: "Enter a name" });
  else if (name.length > NAME_MAX) errors.push({ field: "name", code: "TOO_LONG", message: `Use at most ${NAME_MAX} characters` });
  return name;
}

function checkUrl(value: unknown, errors: HubFieldError[]): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push({
      field: "url",
      code: typeof value === "string" || value == null ? "REQUIRED" : "INVALID_TYPE",
      message: "Enter the service address",
    });
    return undefined;
  }
  const url = value.trim();
  if (url.length > URL_MAX) errors.push({ field: "url", code: "TOO_LONG", message: `Use at most ${URL_MAX} characters` });
  else if (!isSafeServiceUrl(url)) errors.push({ field: "url", code: "INVALID_URL", message: "Use a full http:// or https:// address" });
  return url;
}

function checkDescription(value: unknown, errors: HubFieldError[]): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") {
    errors.push({ field: "description", code: "INVALID_TYPE", message: "Description must be text" });
    return undefined;
  }
  const description = value.trim();
  if (description.length > DESCRIPTION_MAX) {
    errors.push({ field: "description", code: "TOO_LONG", message: `Use at most ${DESCRIPTION_MAX} characters` });
  }
  return description === "" ? null : description;
}

function checkDisplayOrder(value: unknown, errors: HubFieldError[]): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    errors.push({ field: "displayOrder", code: "INVALID_TYPE", message: "Order must be a whole number" });
    return undefined;
  }
  if (value < 0 || value > DISPLAY_ORDER_MAX) {
    errors.push({ field: "displayOrder", code: "OUT_OF_RANGE", message: `Order must be between 0 and ${DISPLAY_ORDER_MAX}` });
  }
  return value;
}

function checkIsActive(value: unknown, errors: HubFieldError[]): boolean | undefined {
  if (typeof value !== "boolean") {
    errors.push({ field: "isActive", code: "INVALID_TYPE", message: "Status must be true or false" });
    return undefined;
  }
  return value;
}

function checkReason(value: unknown, errors: HubFieldError[]): void {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") {
    errors.push({ field: "reason", code: "INVALID_TYPE", message: "Reason must be text" });
    return;
  }
  if (value.trim().length > REASON_MAX) errors.push({ field: "reason", code: "TOO_LONG", message: `Use at most ${REASON_MAX} characters` });
}

function checkBody(body: unknown, errors: HubFieldError[]): Record<string, unknown> | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    errors.push({ field: "(body)", code: "INVALID_TYPE", message: "Send a JSON object" });
    return undefined;
  }
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!FIELDS.includes(key)) errors.push({ field: key, code: "UNKNOWN_FIELD", message: `${key} is not a known field` });
  }
  return record;
}

function checkOptional(record: Record<string, unknown>, value: ServiceLinkInput, errors: HubFieldError[]) {
  if (record.description !== undefined) {
    const description = checkDescription(record.description, errors);
    if (description !== undefined) value.description = description;
  }
  if (record.displayOrder !== undefined) value.displayOrder = checkDisplayOrder(record.displayOrder, errors);
  if (record.isActive !== undefined) value.isActive = checkIsActive(record.isActive, errors);
  checkReason(record.reason, errors);
}

/** `POST /admin/services`. */
export function validateCreate(body: unknown): ValidationResult {
  const errors: HubFieldError[] = [];
  const record = checkBody(body, errors);
  if (!record) return { ok: false, errors };
  const value: ServiceLinkInput = { name: checkName(record.name, errors) ?? "", url: checkUrl(record.url, errors) ?? "" };
  checkOptional(record, value, errors);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

/** `PATCH /admin/services/{id}`: like create, every field optional, at least one present. */
export function validateUpdate(body: unknown): ValidationResult {
  const errors: HubFieldError[] = [];
  const record = checkBody(body, errors);
  if (!record) return { ok: false, errors };
  const value: ServiceLinkInput = {};
  if (record.name !== undefined) value.name = checkName(record.name, errors);
  if (record.url !== undefined) value.url = checkUrl(record.url, errors);
  checkOptional(record, value, errors);
  if (CHANGE_FIELDS.every((k) => record[k] === undefined) && errors.length === 0) {
    errors.push({ field: "(body)", code: "EMPTY_UPDATE", message: "Change at least one field" });
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value };
}

/** A positive integer id, as `parseServiceId`; anything else is treated as not found. */
export function parseServiceId(raw: unknown): string | null {
  return typeof raw === "string" && /^[1-9][0-9]{0,17}$/.test(raw) ? raw : null;
}

/** `If-Match`: absent or `*` = no check (null); `"<n>"` or `W/"<n>"` = n; anything else is invalid. */
export function parseIfMatch(header: string | null): number | null | "invalid" {
  if (header === null || header === "" || header === "*") return null;
  const match = /^(?:W\/)?"?([0-9]{1,9})"?$/.exec(header.trim());
  return match ? Number(match[1]) : "invalid";
}
