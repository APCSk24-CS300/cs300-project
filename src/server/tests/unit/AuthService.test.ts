import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	AuthService,
	type PasswordHasher
} from '../../src/services/AuthService.ts';
import type { PasswordCredentialStore } from '../../src/repositories/AuthRepository.ts';

class FakeCredentials implements PasswordCredentialStore {
	passwordHash: string | null = 'old-hash';
	reads: string[] = [];
	updates: { userId: string; currentHash: string; newHash: string }[] = [];
	fail = false;
	allowUpdate = true;

	async getUserPasswordHash(userId: string): Promise<string | null> {
		if (this.fail) throw new Error('database unavailable');
		this.reads.push(userId);
		return this.passwordHash;
	}

	async updateUserPasswordHash(
		userId: string,
		currentHash: string,
		newHash: string
	): Promise<boolean> {
		if (this.fail) throw new Error('database unavailable');
		this.updates.push({ userId, currentHash, newHash });
		if (!this.allowUpdate || this.passwordHash !== currentHash) return false;
		this.passwordHash = newHash;
		return true;
	}
}

class FakeHasher implements PasswordHasher {
	comparisons: { plainText: string; hash: string }[] = [];
	hashes: { plainText: string; saltRounds: number }[] = [];
	match = true;

	async compare(plainText: string, hash: string): Promise<boolean> {
		this.comparisons.push({ plainText, hash });
		return this.match;
	}

	async hash(plainText: string, saltRounds: number): Promise<string> {
		this.hashes.push({ plainText, saltRounds });
		return `new-hash-${this.hashes.length}`;
	}
}

function createService() {
	const credentials = new FakeCredentials();
	const hasher = new FakeHasher();
	return {
		service: new AuthService(credentials, hasher),
		credentials,
		hasher
	};
}

test('changes the authenticated user password with bcrypt-compatible hashing and message-only success', async () => {
	const { service, credentials, hasher } = createService();
	const result = await service.changePassword('user-1', {
		currentPassword: 'old-password',
		newPassword: 'new-password-8'
	});

	assert.equal(result.statusCode, 200);
	assert.deepEqual(result.body, {
		success: true,
		message: 'Password changed successfully'
	});
	assert.equal(JSON.stringify(result.body).includes('old-password'), false);
	assert.equal(JSON.stringify(result.body).includes('new-password-8'), false);
	assert.deepEqual(credentials.updates, [{
		userId: 'user-1',
		currentHash: 'old-hash',
		newHash: 'new-hash-1'
	}]);
	assert.deepEqual(hasher.comparisons, [{
		plainText: 'old-password',
		hash: 'old-hash'
	}]);
	assert.deepEqual(hasher.hashes, [{
		plainText: 'new-password-8',
		saltRounds: 10
	}]);
});

test('rejects short passwords and confirmPassword without accessing credentials', async () => {
	const { service, credentials, hasher } = createService();

	for (const request of [
		{ currentPassword: 'old-password', newPassword: '1234567' },
		{ currentPassword: 'old-password', newPassword: 'new-password-8', confirmPassword: 'new-password-8' }
	]) {
		const result = await service.changePassword('user-1', request);
		assert.equal(result.statusCode, 400);
		assert.equal(result.body.success, false);
	}

	assert.deepEqual(credentials.reads, []);
	assert.deepEqual(credentials.updates, []);
	assert.deepEqual(hasher.hashes, []);
});

test('rejects an incorrect current password without updating the stored hash', async () => {
	const { service, credentials, hasher } = createService();
	hasher.match = false;

	const result = await service.changePassword('user-1', {
		currentPassword: 'wrong-password',
		newPassword: 'new-password-8'
	});

	assert.equal(result.statusCode, 400);
	assert.equal(result.body.success, false);
	if (result.body.success) assert.fail('Expected a current-password error');
	assert.equal(result.body.code, 'CURRENT_PASSWORD_INCORRECT');
	assert.equal(credentials.passwordHash, 'old-hash');
	assert.deepEqual(credentials.updates, []);
	assert.deepEqual(hasher.hashes, []);
});

test('does not overwrite a password changed by a concurrent request', async () => {
	const { service, credentials } = createService();
	credentials.allowUpdate = false;

	const result = await service.changePassword('user-1', {
		currentPassword: 'old-password',
		newPassword: 'new-password-8'
	});

	assert.equal(result.statusCode, 400);
	assert.equal(result.body.success, false);
	if (result.body.success) assert.fail('Expected a stale-password error');
	assert.equal(result.body.code, 'CURRENT_PASSWORD_INCORRECT');
	assert.equal(credentials.passwordHash, 'old-hash');
});

test('returns a generic error without logging password values when storage fails', async () => {
	const { service, credentials } = createService();
	credentials.fail = true;
	const originalError = console.error;
	const logged: unknown[][] = [];
	console.error = (...args: unknown[]) => { logged.push(args); };

	try {
		const result = await service.changePassword('user-1', {
			currentPassword: 'old-password',
			newPassword: 'new-password-8'
		});

		assert.equal(result.statusCode, 500);
		assert.deepEqual(result.body, {
			success: false,
			code: 'INTERNAL_ERROR',
			message: 'Password could not be changed. Please try again.'
		});
		assert.equal(JSON.stringify(logged).includes('old-password'), false);
		assert.equal(JSON.stringify(logged).includes('new-password-8'), false);
	} finally {
		console.error = originalError;
	}
});
