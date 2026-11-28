/**
 * One external university service shown in the University Services Hub (BR `ServiceLink`).
 * This is the API shape (camelCase, matches `UniversityService` in docs/api/openapi.yaml).
 */
export interface ServiceLink {
	id: string,
	name: string,
	description: string | null,
	url: string,
	displayOrder: number,
	isActive: boolean,
	version: number
}

/** Fields an administrator may send when creating a link, after validation and trimming. */
export interface CreateServiceLinkInput {
	name: string,
	url: string,
	description?: string | null,
	displayOrder?: number,
	isActive?: boolean
}

/** Fields an administrator may change. At least one is present after validation. */
export type UpdateServiceLinkInput = Partial<CreateServiceLinkInput>;

/** The audit action recorded for a change (AuditLog.action). */
export type ServiceLinkAction = 'service_link.create' | 'service_link.update' | 'service_link.deactivate' | 'service_link.reactivate';

/** Who made a change and why, written to AuditLog with it. */
export interface ChangeContext {
	actorUserId: string,
	reason?: string
}

/** Values a store needs to apply an update: the full new row, the expected version, and the audit action. */
export interface ServiceLinkChange {
	id: string,
	expectedVersion: number,
	next: Omit<ServiceLink, 'id' | 'version'>,
	action: ServiceLinkAction
}

/**
 * Storage for service links. `ServiceLinkRepository` (PostgreSQL) in production, `FakeServiceLinkStore`
 * in tests. Every write also records one AuditLog row in the same transaction.
 */
export interface ServiceLinkStore {
	/** All links, or only active ones, ordered by display order, then name (case-insensitive), then id. */
	list(includeInactive: boolean): Promise<ServiceLink[]>,
	/** One link by id, active or not; null when there is none. */
	findById(id: string): Promise<ServiceLink | null>,
	/** Largest display order in use, or -1 when there are no links. */
	maxDisplayOrder(): Promise<number>,
	/** Inserts a link and its audit row. Throws `DuplicateNameError` when the name is taken. */
	create(input: Required<CreateServiceLinkInput>, context: ChangeContext): Promise<ServiceLink>,
	/**
	 * Writes `change.next` if the stored version still equals `change.expectedVersion`, bumps the version and
	 * records the audit row. Returns null when the version moved on (someone else saved first).
	 * Throws `DuplicateNameError` when the new name is taken.
	 */
	update(change: ServiceLinkChange, context: ChangeContext): Promise<ServiceLink | null>
}

/** A link with the same name (ignoring case and outer spaces) already exists. */
export class DuplicateNameError extends Error {
	constructor() {
		super('A service with this name already exists');
		this.name = 'DuplicateNameError';
	}
}
