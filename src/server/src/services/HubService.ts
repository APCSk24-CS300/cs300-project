import type {
	ChangeContext, CreateServiceLinkInput, ServiceLink, ServiceLinkAction, ServiceLinkStore, UpdateServiceLinkInput
} from '../types/ServiceLink.ts';
import { DuplicateNameError } from '../types/ServiceLink.ts';
import { DISPLAY_ORDER_MAX } from '../helper/validateServiceLinkRequest.ts';

/** Outcome of a change. `unchanged` means the request asked for values the link already has. */
export type HubChangeResult =
	| { kind: 'ok', link: ServiceLink }
	| { kind: 'unchanged', link: ServiceLink }
	| { kind: 'not_found' }
	| { kind: 'stale', current: ServiceLink | null }
	| { kind: 'duplicate' };

/**
 * Business rules of the University Services Hub (UC-07, BR-NOT-06, BR-ADM-01, BR-ADM-03). HTTP-free:
 * `HubController` maps results to responses. Store failures (database down) are thrown to the caller.
 *
 * Rules:
 * - The hub shows active links only; inactive links are hidden but never deleted.
 * - A new link without a display order goes to the end (largest order + 1).
 * - An update that changes nothing is not written and not audited.
 * - A change whose only effect is switching `isActive` is audited as deactivate or reactivate.
 * - When the caller sends the version it saw and the link has moved on, nothing is written (stale).
 */
export class HubService {
	private readonly store: ServiceLinkStore;

	constructor(store: ServiceLinkStore) {
		this.store = store;
	}

	/** Active links in hub order. An empty array means none are configured (UC-07 A1). */
	listActive(): Promise<ServiceLink[]> {
		return this.store.list(false);
	}

	/** One active link, or null when it does not exist or is inactive. */
	async getActive(id: string): Promise<ServiceLink | null> {
		const link = await this.store.findById(id);
		return link && link.isActive ? link : null;
	}

	/** Links for the admin page; inactive ones included unless asked otherwise. */
	listForAdmin(includeInactive: boolean): Promise<ServiceLink[]> {
		return this.store.list(includeInactive);
	}

	/** One link for the admin page, active or not. */
	getForAdmin(id: string): Promise<ServiceLink | null> {
		return this.store.findById(id);
	}

	/** Adds a link. Defaults: active, no description, placed last. */
	async create(input: CreateServiceLinkInput, context: ChangeContext): Promise<HubChangeResult> {
		const displayOrder = input.displayOrder ?? Math.min(await this.store.maxDisplayOrder() + 1, DISPLAY_ORDER_MAX);
		try {
			const link = await this.store.create({
				name: input.name,
				url: input.url,
				description: input.description ?? null,
				displayOrder,
				isActive: input.isActive ?? true
			}, context);
			return { kind: 'ok', link };
		} catch (err) {
			if (err instanceof DuplicateNameError) return { kind: 'duplicate' };
			throw err;
		}
	}

	/**
	 * Changes some fields of a link.
	 * @param {string} id - Service id.
	 * @param {UpdateServiceLinkInput} input - Validated fields to change.
	 * @param {number | null} expectedVersion - Version from If-Match, or null to skip the check.
	 * @param {ChangeContext} context - Actor and reason for the audit row.
	 */
	async update(id: string, input: UpdateServiceLinkInput, expectedVersion: number | null, context: ChangeContext): Promise<HubChangeResult> {
		const current = await this.store.findById(id);
		if (!current) return { kind: 'not_found' };
		if (expectedVersion !== null && expectedVersion !== current.version) return { kind: 'stale', current };

		const next = {
			name: input.name ?? current.name,
			url: input.url ?? current.url,
			description: input.description !== undefined ? input.description : current.description,
			displayOrder: input.displayOrder ?? current.displayOrder,
			isActive: input.isActive ?? current.isActive
		};
		const changed = (Object.keys(next) as (keyof typeof next)[]).filter((k) => next[k] !== current[k]);
		if (changed.length === 0) return { kind: 'unchanged', link: current };

		let action: ServiceLinkAction = 'service_link.update';
		if (changed.length === 1 && changed[0] === 'isActive') {
			action = next.isActive ? 'service_link.reactivate' : 'service_link.deactivate';
		}

		try {
			const link = await this.store.update({ id, expectedVersion: current.version, next, action }, context);
			if (!link) return { kind: 'stale', current: await this.store.findById(id) };
			return { kind: 'ok', link };
		} catch (err) {
			if (err instanceof DuplicateNameError) return { kind: 'duplicate' };
			throw err;
		}
	}

	/** Hides a link from the hub (sets isActive=false). Doing it twice is harmless and audited once. */
	deactivate(id: string, expectedVersion: number | null, context: ChangeContext): Promise<HubChangeResult> {
		return this.update(id, { isActive: false }, expectedVersion, context);
	}
}
