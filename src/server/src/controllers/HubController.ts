import type { Request, Response } from 'express';
import type { HubService, HubChangeResult } from '../services/HubService.ts';
import type { ChangeContext, ServiceLink } from '../types/ServiceLink.ts';
import type { ServiceResponse } from '../types/ServiceResponse.ts';
import {
	parseIfMatch, parseServiceId, validateCreateServiceLink, validateUpdateServiceLink
} from '../helper/validateServiceLinkRequest.ts';
import { generate200Response } from '../helper/generate200Response.ts';
import { generate201Response } from '../helper/generate201Response.ts';
import { generate400Response } from '../helper/generate400Response.ts';
import { generate404Response } from '../helper/generate404Response.ts';
import { generate409Response } from '../helper/generate409Response.ts';
import { generate412Response } from '../helper/generate412Response.ts';
import { generate503Response } from '../helper/generate503Response.ts';

const NOT_FOUND = 'This university service does not exist or is no longer available';

function send(res: Response, response: ServiceResponse): void {
	res.status(response.statusCode).json(response.get());
}

function etag(link: ServiceLink): string {
	return `"${link.version}"`;
}

function actor(res: Response, reason?: string): ChangeContext {
	const sub = (res.locals.user as { sub?: unknown } | undefined)?.sub;
	return { actorUserId: String(sub), reason };
}

/** Runs a handler and turns a thrown store error (database down) into 503, as the AI routes do. */
async function guarded(res: Response, kind: string, work: () => Promise<void>): Promise<void> {
	try {
		await work();
	} catch (err) {
		const sub = (res.locals.user as { sub?: unknown } | undefined)?.sub;
		console.error(`[HUB] ${new Date().toISOString()} user=${String(sub)} kind=${kind}_failed`, err);
		send(res, generate503Response('University services are temporarily unavailable, please try again later'));
	}
}

/**
 * HTTP handling for the University Services Hub (UC-07). Validates input, calls `HubService`, and maps
 * results to responses in the `ServiceResponse` envelope. Admin responses carry `ETag: "<version>"` and
 * admin mutations honour `If-Match` (412 when stale).
 *
 * Routes (see `routes/HubRoute.ts`, specs/004-university-service-hub/contracts/hub-api.md):
 * - `GET /api/v1/hub/services` (`hub.services.read`)
 * - `GET /api/v1/hub/services/:serviceId` (`hub.services.read`)
 * - `GET|POST /api/v1/admin/services` (`hub.services.manage`)
 * - `PATCH|DELETE /api/v1/admin/services/:serviceId` (`hub.services.manage`)
 */
export class HubController {
	private readonly service: HubService;

	constructor(service: HubService) {
		this.service = service;
	}

	/**
	 * Lists active university services in display order. An empty list means none are configured.
	 *
	 * @example <caption>cURL</caption>
	 * curl --header 'Authorization: Bearer <access token>' http://localhost:8080/api/v1/hub/services
	 *
	 * @example <caption>Response (200)</caption>
	 * {
	 *   "success": true,
	 *   "statusCode": 200,
	 *   "payload": {
	 *     "message": "OK (OK)",
	 *     "data": [
	 *       { "id": "1", "name": "Moodle", "description": "Courses, assignments and lecture materials",
	 *         "url": "https://moodle.hcmus.edu.vn/", "displayOrder": 1, "isActive": true, "version": 1 }
	 *     ]
	 *   }
	 * }
	 */
	list = async (_req: Request, res: Response): Promise<void> => guarded(res, 'hub_list', async () => {
		send(res, generate200Response(await this.service.listActive()));
	});

	/** One active service. 404 when unknown, inactive, or the id is not a positive integer. */
	get = async (req: Request, res: Response): Promise<void> => guarded(res, 'hub_get', async () => {
		const id = parseServiceId(req.params.serviceId);
		const link = id ? await this.service.getActive(id) : null;
		if (!link) return send(res, generate404Response(NOT_FOUND));
		send(res, generate200Response(link));
	});

	/** Admin list. <code>?includeInactive=false</code> hides inactive links; default shows them. */
	adminList = async (req: Request, res: Response): Promise<void> => guarded(res, 'admin_list', async () => {
		const raw = req.query.includeInactive;
		if (raw !== undefined && raw !== 'true' && raw !== 'false') {
			return send(res, generate400Response('Invalid query', [
				{ field: 'includeInactive', code: 'INVALID_TYPE', message: 'Use true or false' }
			]));
		}
		send(res, generate200Response(await this.service.listForAdmin(raw !== 'false')));
	});

	/**
	 * Creates a link. Body: <code>{ name, url, description?, displayOrder?, isActive?, reason? }</code>.
	 *
	 * @example <caption>Response (400, '{"name": "", "url": "javascript:alert(1)"}')</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 400,
	 *   "payload": {
	 *     "message": "Invalid service link (BAD_REQUEST)",
	 *     "data": { "details": [
	 *       { "field": "name", "code": "REQUIRED", "message": "Enter a name" },
	 *       { "field": "url", "code": "INVALID_URL", "message": "Use a full http:// or https:// address" } ] }
	 *   }
	 * }
	 *
	 * @response
	 * - `201 CREATED` - with headers `ETag` and `Location`
	 * - `400 BAD_REQUEST` - field errors in `data.details`
	 * - `409 CONFLICT` - name already used (`data.details[0].code` = `DUPLICATE_VALUE`)
	 */
	create = async (req: Request, res: Response): Promise<void> => guarded(res, 'admin_create', async () => {
		const result = validateCreateServiceLink(req.body);
		if (!result.ok) return send(res, generate400Response('Invalid service link', result.errors));
		const outcome = await this.service.create(result.value, actor(res, result.reason));
		if (outcome.kind === 'ok') {
			res.set('ETag', etag(outcome.link)).set('Location', `/api/v1/admin/services/${outcome.link.id}`);
			return send(res, generate201Response(outcome.link));
		}
		this.sendFailure(res, outcome);
	});

	/** Changes some fields. Honours <code>If-Match</code>. An update that changes nothing returns 200 and is not audited. */
	update = async (req: Request, res: Response): Promise<void> => guarded(res, 'admin_update', async () => {
		const id = parseServiceId(req.params.serviceId);
		if (!id) return send(res, generate404Response(NOT_FOUND));
		const version = parseIfMatch(req.headers['if-match']);
		const result = validateUpdateServiceLink(req.body);
		if (!result.ok) return send(res, generate400Response('Invalid service link', result.errors));
		if (version === 'invalid') return send(res, generate412Response());
		this.sendChange(res, await this.service.update(id, result.value, version, actor(res, result.reason)));
	});

	/** Deactivates a link (never deletes it). Honours <code>If-Match</code>. Already inactive → 200, no audit row. */
	deactivate = async (req: Request, res: Response): Promise<void> => guarded(res, 'admin_deactivate', async () => {
		const id = parseServiceId(req.params.serviceId);
		if (!id) return send(res, generate404Response(NOT_FOUND));
		const version = parseIfMatch(req.headers['if-match']);
		if (version === 'invalid') return send(res, generate412Response());
		this.sendChange(res, await this.service.deactivate(id, version, actor(res)));
	});

	private sendChange(res: Response, outcome: HubChangeResult): void {
		if (outcome.kind === 'ok' || outcome.kind === 'unchanged') {
			res.set('ETag', etag(outcome.link));
			return send(res, generate200Response(outcome.link));
		}
		this.sendFailure(res, outcome);
	}

	private sendFailure(res: Response, outcome: HubChangeResult): void {
		switch (outcome.kind) {
			case 'not_found':
				return send(res, generate404Response(NOT_FOUND));
			case 'stale':
				return send(res, generate412Response(undefined, { currentVersion: outcome.current?.version ?? null }));
			case 'duplicate':
				return send(res, generate409Response('A service with this name already exists', [
					{ field: 'name', code: 'DUPLICATE_VALUE', message: 'A service with this name already exists' }
				]));
			default:
				return send(res, generate503Response());
		}
	}
}
