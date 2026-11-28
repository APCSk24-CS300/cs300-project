import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HubService } from '../../src/services/HubService.ts';
import { FakeServiceLinkStore } from '../helpers/fakes.ts';

const admin = { actorUserId: 'admin-1' };

function setup() {
	const store = new FakeServiceLinkStore([
		{ name: 'Student Portal', displayOrder: 2 },
		{ name: 'moodle', displayOrder: 1 },
		{ name: 'Library', displayOrder: 1, isActive: false },
		{ name: 'Alpha', displayOrder: 2 }
	]);
	return { store, service: new HubService(store) };
}

test('listActive hides inactive links and orders by display order, then name, then id', async () => {
	const { service } = setup();
	assert.deepEqual((await service.listActive()).map((l) => l.name), ['moodle', 'Alpha', 'Student Portal']);
});

test('listForAdmin includes inactive links', async () => {
	const { service } = setup();
	assert.deepEqual((await service.listForAdmin(true)).map((l) => l.name), ['Library', 'moodle', 'Alpha', 'Student Portal']);
});

test('getActive returns null for inactive or unknown links', async () => {
	const { service } = setup();
	assert.equal((await service.getActive('1'))?.name, 'Student Portal');
	assert.equal(await service.getActive('3'), null);
	assert.equal(await service.getActive('99'), null);
});

test('create defaults to active, last place, no description, and audits', async () => {
	const { service, store } = setup();
	const r = await service.create({ name: 'Tuition', url: 'https://t.edu' }, { ...admin, reason: 'new' });
	assert.equal(r.kind, 'ok');
	if (r.kind !== 'ok') return;
	assert.deepEqual({ ...r.link, id: 'x' }, { id: 'x', name: 'Tuition', url: 'https://t.edu', description: null, displayOrder: 3, isActive: true, version: 1 });
	assert.equal(store.audit.length, 1);
	assert.deepEqual([store.audit[0]!.action, store.audit[0]!.reason, store.audit[0]!.before], ['service_link.create', 'new', null]);
});

test('create in an empty hub starts at order 0', async () => {
	const service = new HubService(new FakeServiceLinkStore());
	const r = await service.create({ name: 'A', url: 'https://a.edu' }, admin);
	assert.equal(r.kind === 'ok' && r.link.displayOrder, 0);
});

test('create with a taken name (case and spaces ignored) is a duplicate', async () => {
	const { service, store } = setup();
	assert.deepEqual(await service.create({ name: ' MOODLE', url: 'https://m.edu' }, admin), { kind: 'duplicate' });
	assert.equal(store.audit.length, 0);
});

test('update changes fields, bumps the version and audits before/after', async () => {
	const { service, store } = setup();
	const r = await service.update('1', { url: 'https://portal.new/', description: 'Grades' }, 1, admin);
	assert.equal(r.kind, 'ok');
	if (r.kind !== 'ok') return;
	assert.equal(r.link.version, 2);
	assert.equal(store.audit[0]!.action, 'service_link.update');
	assert.equal(store.audit[0]!.before?.url, 'https://example.edu/');
	assert.equal(store.audit[0]!.after.url, 'https://portal.new/');
});

test('update with the values already stored writes nothing', async () => {
	const { service, store } = setup();
	const r = await service.update('1', { name: 'Student Portal', displayOrder: 2 }, null, admin);
	assert.equal(r.kind, 'unchanged');
	assert.equal(store.audit.length, 0);
	assert.equal(store.links[0]!.version, 1);
});

test('update with an old version is stale and writes nothing', async () => {
	const { service, store } = setup();
	await service.update('1', { name: 'Portal' }, 1, admin);
	const r = await service.update('1', { name: 'Portal 2' }, 1, admin);
	assert.equal(r.kind, 'stale');
	assert.equal(r.kind === 'stale' && r.current?.version, 2);
	assert.equal(store.links[0]!.name, 'Portal');
});

test('update to a taken name is a duplicate', async () => {
	const { service } = setup();
	assert.deepEqual(await service.update('1', { name: 'alpha' }, null, admin), { kind: 'duplicate' });
});

test('update of an unknown link is not_found', async () => {
	const { service } = setup();
	assert.deepEqual(await service.update('99', { name: 'x' }, null, admin), { kind: 'not_found' });
});

test('deactivate then reactivate are audited with their own actions; deactivating twice is harmless', async () => {
	const { service, store } = setup();
	assert.equal((await service.deactivate('1', null, admin)).kind, 'ok');
	assert.equal((await service.deactivate('1', null, admin)).kind, 'unchanged');
	assert.equal((await service.update('1', { isActive: true }, null, admin)).kind, 'ok');
	assert.deepEqual(store.audit.map((a) => a.action), ['service_link.deactivate', 'service_link.reactivate']);
	assert.equal(store.links.length, 4, 'nothing is deleted');
});

test('a change to status and another field is a plain update', async () => {
	const { service, store } = setup();
	await service.update('3', { isActive: true, name: 'HCMUS Library' }, null, admin);
	assert.equal(store.audit[0]!.action, 'service_link.update');
});

test('store failures are thrown to the caller', async () => {
	const { service, store } = setup();
	store.fail = true;
	await assert.rejects(service.listActive());
	await assert.rejects(service.create({ name: 'x', url: 'https://x.edu' }, admin));
});
