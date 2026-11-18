// In-memory stand-ins for the database-backed parts of the AI module, so unit and
// integration tests run without PostgreSQL.
import type { IdentityStore } from '../../src/ai/identity/IdentityStore.ts';
import type { AIRole } from '../../src/ai/types.ts';
import type { SettingsSource } from '../../src/ai/settings/AISettings.ts';
import type { RequestLogRow, RequestLogStore } from '../../src/repositories/ai/AiRequestLogRepository.ts';

export interface FakeUser { roles: AIRole[], facultyId?: string | null, permissions?: string[] }

/** Every user not listed is a student in faculty F1 with `ai.chat`, unless `strict` is set. */
export class FakeIdentityStore implements IdentityStore {
	users: Record<string, FakeUser>;
	strict: boolean;
	fail = false;

	constructor(users: Record<string, FakeUser> = {}, strict = false) {
		this.users = users;
		this.strict = strict;
	}

	private user(userId: string): FakeUser | undefined {
		return this.users[userId] ?? (this.strict ? undefined : { roles: ['student'], facultyId: 'F1', permissions: ['ai.chat'] });
	}
	async getRoles(userId: string) { if (this.fail) throw new Error('db down'); return this.user(userId)?.roles ?? []; }
	async getFacultyId(userId: string) { if (this.fail) throw new Error('db down'); return this.user(userId)?.facultyId ?? null; }
	async hasPermission(userId: string, code: string) {
		if (this.fail) throw new Error('db down');
		return this.user(userId)?.permissions?.includes(code) ?? false;
	}
}

export class FakeSettingsSource implements SettingsSource {
	values: Record<string, string>;
	loads = 0;
	fail = false;

	constructor(values: Record<string, string> = {}) {
		this.values = { 'ai.enabled': 'true', ...values };
	}
	async loadAiSettings() {
		this.loads++;
		if (this.fail) throw new Error('db down');
		return { ...this.values };
	}
}

export class FakeRequestLogStore implements RequestLogStore {
	rows: RequestLogRow[] = [];
	fail = false;

	async insert(row: RequestLogRow) {
		if (this.fail) throw new Error('db down');
		this.rows.push(row);
	}
}

/** Runs fn with console.error captured, returning what was logged. */
export async function captureErrors<T>(fn: () => Promise<T>): Promise<{ result: T, logs: string[] }> {
	const logs: string[] = [];
	const original = console.error;
	console.error = (...a: unknown[]) => { logs.push(a.join(' ')); };
	try {
		return { result: await fn(), logs };
	} finally {
		console.error = original;
	}
}
