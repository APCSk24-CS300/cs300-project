import type { CreateServiceLinkInput, UpdateServiceLinkInput } from '../types/ServiceLink.ts';

/** One problem with one field. `code` is stable and the frontend may branch on it; `message` is for display. */
export interface FieldError {
	field: string,
	code: 'REQUIRED' | 'TOO_LONG' | 'INVALID_URL' | 'INVALID_TYPE' | 'OUT_OF_RANGE' | 'EMPTY_UPDATE' | 'UNKNOWN_FIELD',
	message: string
}

export type ValidationResult<T> = { ok: true, value: T, reason?: string } | { ok: false, errors: FieldError[] };

export const NAME_MAX = 100;
export const URL_MAX = 2048;
export const DESCRIPTION_MAX = 500;
export const REASON_MAX = 200;
export const DISPLAY_ORDER_MAX = 9999;

const FIELDS = ['name', 'url', 'description', 'displayOrder', 'isActive', 'reason'];

/**
 * Checks that a URL is safe to render as a link: absolute, `http:` or `https:`, no user name or password,
 * no whitespace, at most 2048 characters. Rejects `javascript:` and `data:` URLs, which would be stored XSS.
 * @param {string} url - The URL as the administrator typed it (already trimmed).
 * @returns {boolean} true when the URL may be stored.
 */
export function isSafeServiceUrl(url: string): boolean {
	if (url.length === 0 || url.length > URL_MAX || /\s/.test(url)) return false;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return false;
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
	if (parsed.username !== '' || parsed.password !== '') return false;
	return parsed.hostname !== '';
}

function checkName(value: unknown, errors: FieldError[]): string | undefined {
	if (typeof value !== 'string') {
		errors.push({ field: 'name', code: value === undefined || value === null ? 'REQUIRED' : 'INVALID_TYPE', message: 'Enter a name' });
		return undefined;
	}
	const name = value.trim();
	if (name === '') errors.push({ field: 'name', code: 'REQUIRED', message: 'Enter a name' });
	else if (name.length > NAME_MAX) errors.push({ field: 'name', code: 'TOO_LONG', message: `Use at most ${NAME_MAX} characters` });
	return name;
}

function checkUrl(value: unknown, errors: FieldError[]): string | undefined {
	if (typeof value !== 'string' || value.trim() === '') {
		errors.push({ field: 'url', code: typeof value === 'string' || value == null ? 'REQUIRED' : 'INVALID_TYPE', message: 'Enter the service address' });
		return undefined;
	}
	const url = value.trim();
	if (url.length > URL_MAX) errors.push({ field: 'url', code: 'TOO_LONG', message: `Use at most ${URL_MAX} characters` });
	else if (!isSafeServiceUrl(url)) errors.push({ field: 'url', code: 'INVALID_URL', message: 'Use a full http:// or https:// address' });
	return url;
}

function checkDescription(value: unknown, errors: FieldError[]): string | null | undefined {
	if (value === null) return null;
	if (typeof value !== 'string') {
		errors.push({ field: 'description', code: 'INVALID_TYPE', message: 'Description must be text' });
		return undefined;
	}
	const description = value.trim();
	if (description.length > DESCRIPTION_MAX) {
		errors.push({ field: 'description', code: 'TOO_LONG', message: `Use at most ${DESCRIPTION_MAX} characters` });
	}
	return description === '' ? null : description;
}

function checkDisplayOrder(value: unknown, errors: FieldError[]): number | undefined {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		errors.push({ field: 'displayOrder', code: 'INVALID_TYPE', message: 'Order must be a whole number' });
		return undefined;
	}
	if (value < 0 || value > DISPLAY_ORDER_MAX) {
		errors.push({ field: 'displayOrder', code: 'OUT_OF_RANGE', message: `Order must be between 0 and ${DISPLAY_ORDER_MAX}` });
	}
	return value;
}

function checkIsActive(value: unknown, errors: FieldError[]): boolean | undefined {
	if (typeof value !== 'boolean') {
		errors.push({ field: 'isActive', code: 'INVALID_TYPE', message: 'Status must be true or false' });
		return undefined;
	}
	return value;
}

function checkReason(value: unknown, errors: FieldError[]): string | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== 'string') {
		errors.push({ field: 'reason', code: 'INVALID_TYPE', message: 'Reason must be text' });
		return undefined;
	}
	const reason = value.trim();
	if (reason.length > REASON_MAX) errors.push({ field: 'reason', code: 'TOO_LONG', message: `Use at most ${REASON_MAX} characters` });
	return reason === '' ? undefined : reason;
}

function checkBody(body: unknown, errors: FieldError[]): Record<string, unknown> | undefined {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		errors.push({ field: '(body)', code: 'INVALID_TYPE', message: 'Send a JSON object' });
		return undefined;
	}
	const record = body as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (!FIELDS.includes(key)) errors.push({ field: key, code: 'UNKNOWN_FIELD', message: `${key} is not a known field` });
	}
	return record;
}

/**
 * Validates the body of <code>POST /api/v1/admin/services</code>. Trims text, turns an empty description into
 * null, and reports every problem at once.
 * @param {unknown} body - Parsed JSON body.
 * @returns {ValidationResult<CreateServiceLinkInput>} The clean input and optional audit reason, or the field errors.
 *
 * @example <caption>Result for '{"name": " ", "url": "javascript:alert(1)"}'</caption>
 * { ok: false, errors: [
 *   { field: 'name', code: 'REQUIRED', message: 'Enter a name' },
 *   { field: 'url', code: 'INVALID_URL', message: 'Use a full http:// or https:// address' } ] }
 */
export function validateCreateServiceLink(body: unknown): ValidationResult<CreateServiceLinkInput> {
	const errors: FieldError[] = [];
	const record = checkBody(body, errors);
	if (!record) return { ok: false, errors };

	const value: CreateServiceLinkInput = { name: checkName(record.name, errors) ?? '', url: checkUrl(record.url, errors) ?? '' };
	if (record.description !== undefined) {
		const description = checkDescription(record.description, errors);
		if (description !== undefined) value.description = description;
	}
	if (record.displayOrder !== undefined) value.displayOrder = checkDisplayOrder(record.displayOrder, errors);
	if (record.isActive !== undefined) value.isActive = checkIsActive(record.isActive, errors);
	const reason = checkReason(record.reason, errors);

	return errors.length > 0 ? { ok: false, errors } : { ok: true, value, reason };
}

/**
 * Validates the body of <code>PATCH /api/v1/admin/services/{serviceId}</code>. Same rules as create, every
 * field optional, but at least one of name, url, description, displayOrder, isActive must be present.
 * @param {unknown} body - Parsed JSON body.
 * @returns {ValidationResult<UpdateServiceLinkInput>}
 */
export function validateUpdateServiceLink(body: unknown): ValidationResult<UpdateServiceLinkInput> {
	const errors: FieldError[] = [];
	const record = checkBody(body, errors);
	if (!record) return { ok: false, errors };

	const value: UpdateServiceLinkInput = {};
	if (record.name !== undefined) value.name = checkName(record.name, errors);
	if (record.url !== undefined) value.url = checkUrl(record.url, errors);
	if (record.description !== undefined) {
		const description = checkDescription(record.description, errors);
		if (description !== undefined) value.description = description;
	}
	if (record.displayOrder !== undefined) value.displayOrder = checkDisplayOrder(record.displayOrder, errors);
	if (record.isActive !== undefined) value.isActive = checkIsActive(record.isActive, errors);
	const reason = checkReason(record.reason, errors);

	const changes = ['name', 'url', 'description', 'displayOrder', 'isActive'].filter((k) => record[k] !== undefined);
	if (changes.length === 0 && errors.length === 0) {
		errors.push({ field: '(body)', code: 'EMPTY_UPDATE', message: 'Change at least one field' });
	}

	return errors.length > 0 ? { ok: false, errors } : { ok: true, value, reason };
}

/**
 * Service ids are positive integers (BIGINT identity). Anything else cannot exist, so callers answer 404.
 * @param {string} raw - The <code>serviceId</code> path parameter.
 * @returns {string | null} The canonical id, or null when it is not a valid id.
 */
export function parseServiceId(raw: unknown): string | null {
	if (typeof raw !== 'string' || !/^[1-9][0-9]{0,17}$/.test(raw)) return null;
	return raw;
}

/**
 * Reads the version from an <code>If-Match</code> header. Accepts <code>"3"</code>, <code>W/"3"</code> and <code>3</code>.
 * @param {string | undefined} header - The header value.
 * @returns {number | null | 'invalid'} null when the header is absent or <code>*</code>, 'invalid' when it cannot match any version.
 */
export function parseIfMatch(header: unknown): number | null | 'invalid' {
	if (header === undefined || header === null || header === '' || header === '*') return null;
	if (typeof header !== 'string') return 'invalid';
	const match = /^(?:W\/)?"?([0-9]{1,9})"?$/.exec(header.trim());
	return match ? Number(match[1]) : 'invalid';
}
