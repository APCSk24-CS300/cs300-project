import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoadIdentity } from '../../../src/middleware/LoadIdentity.ts';
import { createRequirePermission } from '../../../src/middleware/RequirePermission.ts';
import { FakeIdentityStore, captureErrors } from '../../helpers/fakes.ts';

// Minimal Express stand-ins: records the status and whether next() ran.
function run(handler: any, user: unknown) {
	const out: { status?: number, nextCalled: boolean, locals: any } = { nextCalled: false, locals: { user } };
	const res: any = {
		locals: out.locals,
		status(code: number) { out.status = code; return res; },
		set() { return res; },
		json() { return res; }
	};
	return Promise.resolve(handler({}, res, () => { out.nextCalled = true; })).then(() => out);
}

const store = new FakeIdentityStore({
	s1: { roles: ['student'], facultyId: 'F2', permissions: ['ai.chat'] },
	m1: { roles: ['manager'], permissions: ['ai.chat', 'ai.chat.manager_tools'] }
}, true);

test('LoadIdentity reads roles and faculty from the database when the token has none', async () => {
	const out = await run(createLoadIdentity(store), { sub: 's1' });
	assert.equal(out.nextCalled, true);
	assert.deepEqual(out.locals.identity, { userId: 's1', roles: ['student'], facultyId: 'F2' });
});

test('LoadIdentity prefers role and faculty claims in the token, ignoring unknown roles', async () => {
	const out = await run(createLoadIdentity(store), { sub: 's1', roles: ['student', 'superuser'], faculty_id: 'F9' });
	assert.deepEqual(out.locals.identity, { userId: 's1', roles: ['student'], facultyId: 'F9' });
});

test('LoadIdentity gives staff no faculty', async () => {
	const out = await run(createLoadIdentity(store), { sub: 'm1' });
	assert.deepEqual(out.locals.identity, { userId: 'm1', roles: ['manager'], facultyId: null });
});

test('LoadIdentity: no subject -> 401; database error -> 503', async () => {
	assert.equal((await run(createLoadIdentity(store), {})).status, 401);
	const failing = new FakeIdentityStore();
	failing.fail = true;
	const { result } = await captureErrors(() => run(createLoadIdentity(failing), { sub: 's1' }));
	assert.equal(result.status, 503);
	assert.equal(result.nextCalled, false);
});

test('RequirePermission lets through only users whose roles grant the permission', async () => {
	const require = createRequirePermission(store);
	assert.equal((await run(require('ai.chat'), { sub: 's1' })).nextCalled, true);
	assert.equal((await run(require('ai.chat.manager_tools'), { sub: 's1' })).status, 403);
	assert.equal((await run(require('ai.chat.manager_tools'), { sub: 'm1' })).nextCalled, true);
	assert.equal((await run(require('ai.chat'), { sub: 'nobody' })).status, 403);
	assert.equal((await run(require('ai.chat'), undefined)).status, 403);
});
