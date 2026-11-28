// In-memory stand-ins for the database-backed parts of the AI module, so unit and
// integration tests run without PostgreSQL.
import type { IdentityStore } from '../../src/repositories/IdentityRepository.ts';
import type { AIRole } from '../../src/types/AIIdentity.ts';
import type { SettingsSource } from '../../src/repositories/AiSettingsRepository.ts';
import type { RequestLogRow, RequestLogStore } from '../../src/repositories/AiRequestLogRepository.ts';

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

// ---- University Services Hub (specs/004-university-service-hub) ----
import type {
	ChangeContext, CreateServiceLinkInput, ServiceLink, ServiceLinkChange, ServiceLinkStore
} from '../../src/types/ServiceLink.ts';
import { DuplicateNameError } from '../../src/types/ServiceLink.ts';

export interface FakeAuditRow { actorUserId: string, action: string, entityId: string, reason: string, before: ServiceLink | null, after: ServiceLink }

/** In-memory ServiceLinkStore with the same ordering, uniqueness and version rules as ServiceLinkRepository. */
export class FakeServiceLinkStore implements ServiceLinkStore {
	links: ServiceLink[] = [];
	audit: FakeAuditRow[] = [];
	fail = false;
	private nextId = 1;

	constructor(seed: Partial<ServiceLink>[] = []) {
		for (const s of seed) {
			this.links.push({
				id: String(this.nextId++), name: s.name ?? `Service ${this.nextId}`, description: s.description ?? null,
				url: s.url ?? 'https://example.edu/', displayOrder: s.displayOrder ?? 0, isActive: s.isActive ?? true, version: s.version ?? 1
			});
		}
	}

	private check() { if (this.fail) throw new Error('db down'); }
	private nameTaken(name: string, exceptId?: string) {
		const key = name.trim().toLowerCase();
		return this.links.some((l) => l.id !== exceptId && l.name.trim().toLowerCase() === key);
	}

	async list(includeInactive: boolean) {
		this.check();
		return this.links.filter((l) => includeInactive || l.isActive)
			.sort((a, b) => a.displayOrder - b.displayOrder || a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || Number(a.id) - Number(b.id))
			.map((l) => ({ ...l }));
	}
	async findById(id: string) { this.check(); const l = this.links.find((x) => x.id === id); return l ? { ...l } : null; }
	async maxDisplayOrder() { this.check(); return this.links.reduce((m, l) => Math.max(m, l.displayOrder), -1); }

	async create(input: Required<CreateServiceLinkInput>, context: ChangeContext) {
		this.check();
		if (this.nameTaken(input.name)) throw new DuplicateNameError();
		const link: ServiceLink = { id: String(this.nextId++), ...input, version: 1 };
		this.links.push(link);
		this.audit.push({ actorUserId: context.actorUserId, action: 'service_link.create', entityId: link.id, reason: context.reason ?? 'service_link.create', before: null, after: { ...link } });
		return { ...link };
	}

	async update(change: ServiceLinkChange, context: ChangeContext) {
		this.check();
		const index = this.links.findIndex((l) => l.id === change.id && l.version === change.expectedVersion);
		if (index < 0) return null;
		if (this.nameTaken(change.next.name, change.id)) throw new DuplicateNameError();
		const before = this.links[index]!;
		const after: ServiceLink = { ...before, ...change.next, version: before.version + 1 };
		this.links[index] = after;
		this.audit.push({ actorUserId: context.actorUserId, action: change.action, entityId: after.id, reason: context.reason ?? change.action, before: { ...before }, after: { ...after } });
		return { ...after };
	}
}
