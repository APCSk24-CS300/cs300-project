import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config.ts';
import type { LoginAccount, SessionContext } from '../repositories/SessionRepository.ts';
import type { Profile } from '../types/Profile.ts';

/** The three role codes (contract `UserRole`); each account has exactly one. */
const ROLE_CODES = ['student', 'manager', 'administrator'] as const;
type RoleCode = (typeof ROLE_CODES)[number];

export const TOKEN_LIFETIME_SECONDS = 3600;

export interface SessionStore {
	findAccountByEmail(email: string): Promise<LoginAccount | null>;
	getContext(userId: string): Promise<SessionContext | null>;
}

export interface ProfileReader {
	getProfileByUserId(userId: string): Promise<Profile | null>;
}

export type LoginResult =
	| { kind: 'ok'; token: string; expiresAt: string }
	| { kind: 'invalid' }
	| { kind: 'disabled' };

/** The /auth/me body the FE reads (contract CurrentUserContext + 003 gaps DOC-02 / DOC-06). */
export interface CurrentUserContext {
	user: Profile & { role: RoleCode | null; status: 'active' | 'inactive'; mustChangePassword: boolean };
	permissions: string[];
	activeOrganizationMemberships: unknown[];
	activeActivityAssignments: unknown[];
}

export type MeResult = { kind: 'ok'; context: CurrentUserContext } | { kind: 'missing' } | { kind: 'disabled' };

/**
 * Versioned session API (/api/v1/auth), on the same JWT as the legacy /api/auth/login
 * (`sub` = DB user_id, `name`, 1 hour, `config.jwt.secret`), so validateAccessToken and the hub /
 * profile permission checks accept it.
 */
export class SessionService {
	private readonly store: SessionStore;
	private readonly profiles: ProfileReader;

	constructor(store: SessionStore, profiles: ProfileReader) {
		this.store = store;
		this.profiles = profiles;
	}

	async login(email: string, password: string): Promise<LoginResult> {
		const account = await this.store.findAccountByEmail(email);
		// Unknown email and wrong password answer the same (no account enumeration, 003 DOC-04).
		if (!account || !(await bcrypt.compare(password, account.passwordHash))) return { kind: 'invalid' };
		if (!account.isActive) return { kind: 'disabled' };
		const exp = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
		const token = jwt.sign({ sub: account.userId, name: account.fullName, exp }, config.jwt.secret);
		return { kind: 'ok', token, expiresAt: new Date(exp * 1000).toISOString() };
	}

	async me(userId: string): Promise<MeResult> {
		const context = await this.store.getContext(userId);
		if (!context) return { kind: 'missing' };
		if (!context.isActive) return { kind: 'disabled' };
		const profile = await this.profiles.getProfileByUserId(userId);
		if (!profile) return { kind: 'missing' };
		// Exactly one role (BR-ADM-12); anything else is "no valid role" for the FE (003 DOC-02).
		const valid = context.roles.filter((r): r is RoleCode => (ROLE_CODES as readonly string[]).includes(r));
		const role = valid.length === 1 ? valid[0]! : null;
		return {
			kind: 'ok',
			context: {
				user: { ...profile, role, status: 'active', mustChangePassword: false },
				permissions: context.permissions,
				activeOrganizationMemberships: [],
				activeActivityAssignments: []
			}
		};
	}
}
