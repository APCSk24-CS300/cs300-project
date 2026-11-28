import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../src/config/config.ts';
import { SessionService, type SessionStore, type ProfileReader } from '../../src/services/SessionService.ts';
import type { Profile } from '../../src/types/Profile.ts';

config.jwt.secret = config.jwt.secret || 'test-secret';

const profile: Profile = {
	id: 'SEED-STUDENT-1',
	email: 'student1@example.com',
	fullName: 'Student One',
	phoneNumber: null,
	avatarUrl: null,
	academicInfo: null
};

async function service(options: { active?: boolean; roles?: string[] } = {}) {
	const passwordHash = await bcrypt.hash('DemoPassword123!', 4);
	const store: SessionStore = {
		findAccountByEmail: async (email) =>
			email === 'student1@example.com'
				? { userId: 'SEED-STUDENT-1', fullName: 'Student One', passwordHash, isActive: options.active ?? true }
				: null,
		getContext: async (userId) =>
			userId === 'SEED-STUDENT-1'
				? { isActive: options.active ?? true, roles: options.roles ?? ['student'], permissions: ['hub.services.read'] }
				: null
	};
	const profiles: ProfileReader = { getProfileByUserId: async (id) => (id === profile.id ? profile : null) };
	return new SessionService(store, profiles);
}

test('login issues a JWT whose sub is the DB user_id, valid for one hour', async () => {
	const result = await (await service()).login('student1@example.com', 'DemoPassword123!');
	assert.equal(result.kind, 'ok');
	if (result.kind !== 'ok') return;
	const claims = jwt.verify(result.token, config.jwt.secret) as jwt.JwtPayload;
	assert.equal(claims.sub, 'SEED-STUDENT-1');
	assert.equal(claims.name, 'Student One');
	assert.equal(new Date(result.expiresAt).getTime() / 1000, claims.exp);
	assert.ok(claims.exp! - Math.floor(Date.now() / 1000) <= 3600);
});

test('an unknown email and a wrong password are the same "invalid" result', async () => {
	const s = await service();
	assert.deepEqual(await s.login('nobody@example.com', 'DemoPassword123!'), { kind: 'invalid' });
	assert.deepEqual(await s.login('student1@example.com', 'wrong'), { kind: 'invalid' });
});

test('an inactive account cannot sign in or read its context', async () => {
	const s = await service({ active: false });
	assert.deepEqual(await s.login('student1@example.com', 'DemoPassword123!'), { kind: 'disabled' });
	assert.deepEqual(await s.me('SEED-STUDENT-1'), { kind: 'disabled' });
});

test('me returns the profile with exactly one role, status and mustChangePassword', async () => {
	const result = await (await service()).me('SEED-STUDENT-1');
	assert.equal(result.kind, 'ok');
	if (result.kind !== 'ok') return;
	assert.deepEqual(result.context.user, { ...profile, role: 'student', status: 'active', mustChangePassword: false });
	assert.deepEqual(result.context.permissions, ['hub.services.read']);
});

test('me reports role null when the account does not have exactly one valid role', async () => {
	for (const roles of [[], ['student', 'manager'], ['organizer']]) {
		const result = await (await service({ roles })).me('SEED-STUDENT-1');
		assert.equal(result.kind, 'ok');
		if (result.kind === 'ok') assert.equal(result.context.user.role, null, JSON.stringify(roles));
	}
	assert.deepEqual(await (await service()).me('unknown'), { kind: 'missing' });
});
