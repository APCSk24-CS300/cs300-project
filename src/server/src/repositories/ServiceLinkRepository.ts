import type { Pool, PoolClient } from 'pg';
import type {
	ChangeContext, CreateServiceLinkInput, ServiceLink, ServiceLinkAction, ServiceLinkChange, ServiceLinkStore
} from '../types/ServiceLink.ts';
import { DuplicateNameError } from '../types/ServiceLink.ts';

interface ServiceLinkRow {
	service_id: string,
	name: string,
	url: string,
	description: string | null,
	display_order: number,
	is_active: boolean,
	version: number
}

const COLUMNS = 'service_id::text AS service_id, name, url, description, display_order, is_active, version';
const ORDER = 'ORDER BY display_order, lower(name), service_id';

function toLink(row: ServiceLinkRow): ServiceLink {
	return {
		id: row.service_id,
		name: row.name,
		description: row.description,
		url: row.url,
		displayOrder: row.display_order,
		isActive: row.is_active,
		version: row.version
	};
}

/** Postgres unique_violation, raised by the name index. */
function isUniqueViolation(err: unknown): boolean {
	return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === '23505';
}

/**
 * `ServiceLinkStore` over the "ServiceLink" and "AuditLog" tables (src/db/schema.sql + src/db/hub_schema.sql).
 * Each write and its audit row commit together or not at all (BR-ADM-03, BR-ADM-10).
 *
 * @example <caption>Usage</caption>
 * const store = new ServiceLinkRepository(DbConnection.pool);
 * const links = await store.list(false);
 */
export class ServiceLinkRepository implements ServiceLinkStore {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	async list(includeInactive: boolean): Promise<ServiceLink[]> {
		const where = includeInactive ? '' : 'WHERE is_active';
		const { rows } = await this.pool.query<ServiceLinkRow>(`SELECT ${COLUMNS} FROM "ServiceLink" ${where} ${ORDER}`);
		return rows.map(toLink);
	}

	async findById(id: string): Promise<ServiceLink | null> {
		const { rows } = await this.pool.query<ServiceLinkRow>(`SELECT ${COLUMNS} FROM "ServiceLink" WHERE service_id = $1`, [id]);
		return rows[0] ? toLink(rows[0]) : null;
	}

	async maxDisplayOrder(): Promise<number> {
		const { rows } = await this.pool.query<{ max: number | null }>('SELECT max(display_order) AS max FROM "ServiceLink"');
		return rows[0]?.max ?? -1;
	}

	async create(input: Required<CreateServiceLinkInput>, context: ChangeContext): Promise<ServiceLink> {
		return this.inTransaction(async (client) => {
			const { rows } = await client.query<ServiceLinkRow>(
				`INSERT INTO "ServiceLink" (name, url, description, display_order, is_active)
				 VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
				[input.name, input.url, input.description, input.displayOrder, input.isActive]
			);
			const link = toLink(rows[0]!);
			await this.audit(client, context, 'service_link.create', link.id, null, link);
			return link;
		});
	}

	async update(change: ServiceLinkChange, context: ChangeContext): Promise<ServiceLink | null> {
		return this.inTransaction(async (client) => {
			const before = await client.query<ServiceLinkRow>(
				`SELECT ${COLUMNS} FROM "ServiceLink" WHERE service_id = $1 AND version = $2 FOR UPDATE`,
				[change.id, change.expectedVersion]
			);
			if (!before.rows[0]) return null;

			const { next } = change;
			const { rows } = await client.query<ServiceLinkRow>(
				`UPDATE "ServiceLink"
				 SET name = $3, url = $4, description = $5, display_order = $6, is_active = $7, version = version + 1
				 WHERE service_id = $1 AND version = $2
				 RETURNING ${COLUMNS}`,
				[change.id, change.expectedVersion, next.name, next.url, next.description, next.displayOrder, next.isActive]
			);
			const link = toLink(rows[0]!);
			await this.audit(client, context, change.action, link.id, toLink(before.rows[0]), link);
			return link;
		});
	}

	private async audit(client: PoolClient, context: ChangeContext, action: ServiceLinkAction, id: string,
		before: ServiceLink | null, after: ServiceLink): Promise<void> {
		await client.query(
			`INSERT INTO "AuditLog" (actor_user_id, entity_type, entity_id, action, reason, before_values, after_values)
			 VALUES ($1, 'ServiceLink', $2, $3, $4, $5, $6)`,
			[context.actorUserId, id, action, context.reason ?? action,
				before ? JSON.stringify(before) : null, JSON.stringify(after)]
		);
	}

	private async inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.pool.connect();
		try {
			await client.query('BEGIN');
			const result = await work(client);
			await client.query('COMMIT');
			return result;
		} catch (err) {
			await client.query('ROLLBACK').catch(() => {});
			if (isUniqueViolation(err)) throw new DuplicateNameError();
			throw err;
		} finally {
			client.release();
		}
	}
}
