import type { Pool } from 'pg';
import type { AIRole } from '../types/AIIdentity.ts';

/**
 * Reads who a user is and what they may do. Implemented over the main database by
 * IdentityRepository below; tests use an in-memory fake.
 */
export interface IdentityStore {
	getRoles(userId: string): Promise<AIRole[]>,
	getFacultyId(userId: string): Promise<string | null>,
	hasPermission(userId: string, permissionCode: string): Promise<boolean>
}

const KNOWN_ROLES: readonly string[] = ['student', 'manager', 'administrator'];

/** IdentityStore over UserRole, Role, RolePermission, Permission and Student (main database role). */
export class IdentityRepository implements IdentityStore {
	private readonly pool: Pool;

	constructor(pool: Pool) {
		this.pool = pool;
	}

	/**
	 * Returns the roles of a user from <code>UserRole</code> and <code>Role</code>. A deactivated account (<code>User.is_active = false</code>) has no roles, so it loses AI access at once. Roles other than student, manager and administrator are ignored.
	 * @param {string} userId - <code>User.user_id</code>.
	 * @returns {Promise<AIRole[]>}
	 *
	 * @example <caption>Usage</caption>
	 * await new IdentityRepository(DbConnection.pool).getRoles('23127001');
	 *
	 * @example <caption>Result</caption>
	 * ["student"]
	 *
	 * @example <caption>Deactivated or unknown user</caption>
	 * []
	 */
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

	/**
	 * Returns the faculty of a student from <code>Student.faculty_id</code>. Used to filter activities by eligibility.
	 * @param {string} userId - <code>User.user_id</code>.
	 * @returns {Promise<string | null>} The faculty ID, or <code>null</code> when the user is not a student.
	 *
	 * @example <caption>Usage</caption>
	 * await repository.getFacultyId('23127001');
	 *
	 * @example <caption>Result</caption>
	 * "IT"
	 *
	 * @example <caption>Staff member</caption>
	 * null
	 */
	async getFacultyId(userId: string): Promise<string | null> {
		const { rows } = await this.pool.query<{ faculty_id: string }>(
			`SELECT faculty_id FROM "Student" WHERE user_id = $1`, [userId]);
		return rows[0]?.faculty_id ?? null;
	}

	/**
	 * Tells whether any role of an active user grants a permission (<code>UserRole</code> → <code>RolePermission</code> → <code>Permission</code>).
	 * @param {string} userId - <code>User.user_id</code>.
	 * @param {string} permissionCode - <code>Permission.code</code>, e.g. <code>ai.chat</code>.
	 * @returns {Promise<boolean>}
	 *
	 * @example <caption>Usage</caption>
	 * await repository.hasPermission('23127001', 'ai.chat');
	 *
	 * @example <caption>Result (student)</caption>
	 * true
	 *
	 * @example <caption>Student asking for an admin permission</caption>
	 * await repository.hasPermission('23127001', 'ai.settings.manage'); // false
	 */
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
