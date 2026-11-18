import type { Pool } from 'pg';
import type { IdentityStore } from '../../ai/identity/IdentityStore.ts';
import type { AIRole } from '../../ai/types.ts';

const KNOWN_ROLES: readonly string[] = ['student', 'manager', 'administrator'];

/** IdentityStore over UserRole, Role, RolePermission, Permission and Student (main database role). */
export class IdentityRepository implements IdentityStore {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	async getRoles(userId: string): Promise<AIRole[]> {
		const { rows } = await this.pool.query<{ code: string }>(
			// a deactivated account has no roles, so it loses AI access at once
			`SELECT r.code
			 FROM "UserRole" ur
			 JOIN "Role" r ON r.role_id = ur.role_id
			 JOIN "User" u ON u.user_id = ur.user_id
			 WHERE ur.user_id = $1 AND u.is_active IS NOT FALSE`,
			[userId]);
		return rows.map(r => r.code).filter((c): c is AIRole => KNOWN_ROLES.includes(c));
	}

	async getFacultyId(userId: string): Promise<string | null> {
		const { rows } = await this.pool.query<{ faculty_id: string }>(
			`SELECT faculty_id FROM "Student" WHERE user_id = $1`, [userId]);
		return rows[0]?.faculty_id ?? null;
	}

	async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
		const { rows } = await this.pool.query(
			`SELECT 1
			 FROM "UserRole" ur
			 JOIN "RolePermission" rp ON rp.role_id = ur.role_id
			 JOIN "Permission" p ON p.permission_id = rp.permission_id
			 JOIN "User" u ON u.user_id = ur.user_id
			 WHERE ur.user_id = $1 AND p.code = $2 AND u.is_active IS NOT FALSE
			 LIMIT 1`,
			[userId, permissionCode]);
		return rows.length > 0;
	}
}
