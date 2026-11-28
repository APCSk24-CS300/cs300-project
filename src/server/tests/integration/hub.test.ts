import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// must be set before config.ts is loaded (dynamic imports below)
process.env.JWT_SECRET = 'hub-test-secret';
const jwt = (await import('jsonwebtoken')).default;
const { createApp } = await import('../../src/app.ts');
const { FakeIdentityStore, FakeSettingsSource, FakeRequestLogStore, FakeServiceLinkStore } = await import('../helpers/fakes.ts');

const identityStore = new FakeIdentityStore({
	student: { roles: ['student'], permissions: ['hub.services.read'] },
	manager: { roles: ['manager'], permissions: ['hub.services.read'] },
	admin: { roles: ['administrator'], permissions: ['hub.services.read', 'hub.services.manage'] },
	nobody: { roles: [], permissions: [] }
}, true);

let store: InstanceType<typeof FakeServiceLinkStore>;
let server: Server, base: string;
const realError = console.error;

const token = (sub: string) => jwt.sign({ sub }, 'hub-test-secret');
const headers = (sub: string, extra: Record<string, string> = {}) => ({ Authorization: `Bearer ${token(sub)}`, ...extra });
const json = (sub: string, extra: Record<string, string> = {}) => headers(sub, { 'Content-Type': 'application/json', ...extra });

async function call(method: string, path: string, init: { headers?: Record<string, string>, body?: unknown } = {}) {
	const res = await fetch(base + path, {
		method,
		headers: init.headers,
		body: init.body === undefined ? undefined : JSON.stringify(init.body)
	});
	const body = await res.json() as any;
	return { status: res.status, body, etag: res.headers.get('etag'), location: res.headers.get('location') };
}

before(async () => {
	console.error = () => {};
	const app = createApp({
		llmClient: { generate: async () => ({ text: '' }) } as any,
		identityStore, settingsSource: new FakeSettingsSource(), requestLogStore: new FakeRequestLogStore(),
		serviceLinkStore: { list: (i: boolean) => store.list(i), findById: (id: string) => store.findById(id),
			maxDisplayOrder: () => store.maxDisplayOrder(), create: (a: any, c: any) => store.create(a, c), update: (a: any, c: any) => store.update(a, c) },
		quiet: true
	});
	server = app.listen(0);
	base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
});

after(() => {
	console.error = realError;
	server.close();
});

beforeEach(() => {
	store = new FakeServiceLinkStore([
		{ name: 'Student Portal', url: 'https://portal.hcmus.edu.vn/', displayOrder: 2 },
		{ name: 'Moodle', url: 'https://moodle.hcmus.edu.vn/', displayOrder: 1, description: 'Courses' },
		{ name: 'HCMUS Library', displayOrder: 5, isActive: false }
	]);
});

// ---------- US1: hub ----------

test('GET /hub/services lists active links in order for every role', async () => {
	for (const who of ['student', 'manager', 'admin']) {
		const r = await call('GET', '/hub/services', { headers: headers(who) });
		assert.equal(r.status, 200, who);
		assert.equal(r.body.success, true);
		assert.deepEqual(r.body.payload.data.map((l: any) => l.name), ['Moodle', 'Student Portal']);
		assert.deepEqual(Object.keys(r.body.payload.data[0]).sort(), ['description', 'displayOrder', 'id', 'isActive', 'name', 'url', 'version']);
	}
});

test('GET /hub/services returns an empty list when nothing is active', async () => {
	store = new FakeServiceLinkStore([{ name: 'Old', isActive: false }]);
	const r = await call('GET', '/hub/services', { headers: headers('student') });
	assert.equal(r.status, 200);
	assert.deepEqual(r.body.payload.data, []);
});

test('hub needs a token and the read permission', async () => {
	assert.equal((await call('GET', '/hub/services')).status, 401);
	assert.equal((await call('GET', '/hub/services', { headers: { Authorization: 'Bearer nope' } })).status, 401);
	assert.equal((await call('GET', '/hub/services', { headers: headers('nobody') })).status, 403);
	assert.equal((await call('GET', '/hub/services/2', { headers: headers('nobody') })).status, 403);
});

test('GET /hub/services/:id returns active links and 404 otherwise', async () => {
	const ok = await call('GET', '/hub/services/2', { headers: headers('student') });
	assert.equal(ok.status, 200);
	assert.equal(ok.body.payload.data.name, 'Moodle');
	for (const id of ['3', '99', 'abc', '0']) {
		assert.equal((await call('GET', `/hub/services/${id}`, { headers: headers('student') })).status, 404, id);
	}
});

test('hub rejects other methods with 405', async () => {
	const r = await call('POST', '/hub/services', { headers: json('admin'), body: {} });
	assert.equal(r.status, 405);
});

test('hub answers 503 when the store is down', async () => {
	store.fail = true;
	const r = await call('GET', '/hub/services', { headers: headers('student') });
	assert.equal(r.status, 503);
	assert.equal(r.body.success, false);
});

// ---------- US3: administration ----------

test('only administrators reach /admin/services', async () => {
	for (const who of ['student', 'manager']) {
		assert.equal((await call('GET', '/admin/services', { headers: headers(who) })).status, 403, who);
		assert.equal((await call('POST', '/admin/services', { headers: json(who), body: { name: 'x', url: 'https://x.edu' } })).status, 403, who);
		assert.equal((await call('PATCH', '/admin/services/1', { headers: json(who), body: { name: 'x' } })).status, 403, who);
		assert.equal((await call('DELETE', '/admin/services/1', { headers: headers(who) })).status, 403, who);
	}
	assert.equal(store.audit.length, 0);
});

test('GET /admin/services includes inactive links unless asked not to', async () => {
	const all = await call('GET', '/admin/services', { headers: headers('admin') });
	assert.deepEqual(all.body.payload.data.map((l: any) => l.name), ['Moodle', 'Student Portal', 'HCMUS Library']);
	const active = await call('GET', '/admin/services?includeInactive=false', { headers: headers('admin') });
	assert.equal(active.body.payload.data.length, 2);
	assert.equal((await call('GET', '/admin/services?includeInactive=maybe', { headers: headers('admin') })).status, 400);
});

test('POST /admin/services creates a link with ETag, Location and one audit row', async () => {
	const r = await call('POST', '/admin/services', { headers: json('admin'), body: { name: ' E-learning ', url: 'https://elearning.hcmus.edu.vn' } });
	assert.equal(r.status, 201);
	assert.equal(r.etag, '"1"');
	assert.equal(r.location, `/api/v1/admin/services/${r.body.payload.data.id}`);
	assert.equal(r.body.payload.data.name, 'E-learning');
	assert.equal(r.body.payload.data.displayOrder, 6);
	assert.equal(store.audit.length, 1);
	assert.equal(store.audit[0]!.actorUserId, 'admin');
	const hub = await call('GET', '/hub/services', { headers: headers('student') });
	assert.ok(hub.body.payload.data.some((l: any) => l.name === 'E-learning'), 'visible in the hub at once');
});

test('POST /admin/services validates and reports field codes', async () => {
	const r = await call('POST', '/admin/services', { headers: json('admin'), body: { name: '', url: 'javascript:alert(1)' } });
	assert.equal(r.status, 400);
	assert.deepEqual(r.body.payload.data.details.map((e: any) => `${e.field}:${e.code}`).sort(), ['name:REQUIRED', 'url:INVALID_URL']);
	assert.equal(store.audit.length, 0);
});

test('POST /admin/services with a taken name is 409', async () => {
	const r = await call('POST', '/admin/services', { headers: json('admin'), body: { name: 'moodle ', url: 'https://m.edu' } });
	assert.equal(r.status, 409);
	assert.equal(r.body.payload.data.details[0].code, 'DUPLICATE_VALUE');
});

test('POST and PATCH need a JSON content type', async () => {
	assert.equal((await call('POST', '/admin/services', { headers: headers('admin', { 'Content-Type': 'text/plain' }), body: {} })).status, 415);
	assert.equal((await call('PATCH', '/admin/services/1', { headers: headers('admin', { 'Content-Type': 'text/plain' }), body: {} })).status, 415);
});

test('PATCH updates with If-Match and returns the new ETag', async () => {
	const r = await call('PATCH', '/admin/services/1', { headers: json('admin', { 'If-Match': '"1"' }), body: { description: 'Grades', reason: 'wording' } });
	assert.equal(r.status, 200);
	assert.equal(r.etag, '"2"');
	assert.equal(r.body.payload.data.description, 'Grades');
	assert.deepEqual([store.audit[0]!.action, store.audit[0]!.reason], ['service_link.update', 'wording']);
});

test('PATCH with a stale If-Match is 412 and changes nothing', async () => {
	await call('PATCH', '/admin/services/1', { headers: json('admin', { 'If-Match': '"1"' }), body: { name: 'Portal' } });
	const r = await call('PATCH', '/admin/services/1', { headers: json('admin', { 'If-Match': '"1"' }), body: { name: 'Portal 2' } });
	assert.equal(r.status, 412);
	assert.equal(r.body.payload.data.details.currentVersion, 2);
	assert.equal(store.links[0]!.name, 'Portal');
	assert.equal((await call('PATCH', '/admin/services/1', { headers: json('admin', { 'If-Match': 'garbage' }), body: { name: 'x' } })).status, 412);
});

test('PATCH errors: empty body, unknown field, unknown id, duplicate name', async () => {
	assert.equal((await call('PATCH', '/admin/services/1', { headers: json('admin'), body: {} })).status, 400);
	assert.equal((await call('PATCH', '/admin/services/1', { headers: json('admin'), body: { colour: 'red' } })).status, 400);
	assert.equal((await call('PATCH', '/admin/services/99', { headers: json('admin'), body: { name: 'x' } })).status, 404);
	assert.equal((await call('PATCH', '/admin/services/abc', { headers: json('admin'), body: { name: 'x' } })).status, 404);
	assert.equal((await call('PATCH', '/admin/services/1', { headers: json('admin'), body: { name: 'MOODLE' } })).status, 409);
	assert.equal(store.audit.length, 0);
});

test('PATCH that changes nothing is 200 without an audit row', async () => {
	const r = await call('PATCH', '/admin/services/1', { headers: json('admin'), body: { name: 'Student Portal' } });
	assert.equal(r.status, 200);
	assert.equal(r.etag, '"1"');
	assert.equal(store.audit.length, 0);
});

test('DELETE deactivates (never deletes), is idempotent, and reactivation works', async () => {
	const r = await call('DELETE', '/admin/services/2', { headers: headers('admin', { 'If-Match': '"1"' }) });
	assert.equal(r.status, 200);
	assert.equal(r.body.payload.data.isActive, false);
	assert.equal((await call('GET', '/hub/services/2', { headers: headers('student') })).status, 404);
	assert.equal((await call('DELETE', '/admin/services/2', { headers: headers('admin') })).status, 200);
	assert.equal(store.links.length, 3);

	const back = await call('PATCH', '/admin/services/2', { headers: json('admin'), body: { isActive: true } });
	assert.equal(back.status, 200);
	assert.deepEqual(store.audit.map((a) => a.action), ['service_link.deactivate', 'service_link.reactivate']);
	assert.equal((await call('GET', '/hub/services/2', { headers: headers('student') })).status, 200);
});

test('DELETE with a stale If-Match is 412; unknown id is 404', async () => {
	assert.equal((await call('DELETE', '/admin/services/2', { headers: headers('admin', { 'If-Match': '"7"' }) })).status, 412);
	assert.equal((await call('DELETE', '/admin/services/99', { headers: headers('admin') })).status, 404);
	assert.equal(store.links[1]!.isActive, true);
});

test('admin routes reject other methods with 405', async () => {
	assert.equal((await call('PUT', '/admin/services/1', { headers: json('admin'), body: {} })).status, 405);
	assert.equal((await call('DELETE', '/admin/services', { headers: headers('admin') })).status, 405);
});

test('admin routes answer 503 when the store is down', async () => {
	store.fail = true;
	assert.equal((await call('GET', '/admin/services', { headers: headers('admin') })).status, 503);
	assert.equal((await call('POST', '/admin/services', { headers: json('admin'), body: { name: 'x', url: 'https://x.edu' } })).status, 503);
});
