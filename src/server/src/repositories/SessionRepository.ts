import type { Pool } from 'pg';

type QueryExecutor = Pick<Pool, 'query'>;

/** The data login needs for one account, looked up by email (case-insensitive, trimmed). */
export interface LoginAccount {
	userId: string;
	fullName: string;
	passwordHash: string;
	isActive: boolean;
}

/** The session context of one user: account status, its role codes and permission codes. */
export interface SessionContext {
	isActive: boolean;
	roles: string[];
	permissions: string[];
}

/**
 * Reads for the versioned session API (/api/v1/auth). Returns plain typed values, never raw rows.
 */
export class SessionRepository {
	private readonly pool: QueryExecutor;

	constructor(pool: QueryExecutor) {
		this.pool = pool;
	}

	async findAccountByEmail(email: string): Promise<LoginAccount | null> {
		const { rows } = await this.pool.query<{ user_id: string; full_name: string; password_hash: string; is_active: boolean | null }>(
			`SELECT user_id, full_name, password_hash, is_active
			   FROM "User"
			  WHERE lower(email) = lower($1)
			  LIMIT 1`,
			[email.trim()]
		);
		const row = rows[0];
		if (!row) return null;
		return {
			userId: row.user_id,
			fullName: row.full_name,
			passwordHash: row.password_hash,
			isActive: row.is_active !== false
		};
	}

	async getContext(userId: string): Promise<SessionContext | null> {
		const { rows } = await this.pool.query<{ is_active: boolean | null; roles: string[] | null; permissions: string[] | null }>(
			`SELECT u.is_active,
			        ARRAY(SELECT r.code FROM "UserRole" ur JOIN "Role" r ON r.role_id = ur.role_id
			               WHERE ur.user_id = u.user_id ORDER BY r.code) AS roles,
			        ARRAY(SELECT DISTINCT p.code FROM "UserRole" ur
			                 JOIN "RolePermission" rp ON rp.role_id = ur.role_id
			                 JOIN "Permission" p ON p.permission_id = rp.permission_id
			               WHERE ur.user_id = u.user_id ORDER BY p.code) AS permissions
			   FROM "User" u
			  WHERE u.user_id = $1`,
			[userId]
		);
		const row = rows[0];
		if (!row) return null;
		return {
			isActive: row.is_active !== false,
			roles: row.roles ?? [],
			permissions: row.permissions ?? []
		};
	}
}
