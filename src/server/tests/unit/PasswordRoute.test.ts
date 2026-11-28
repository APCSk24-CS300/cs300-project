import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';
import type { ProfileService } from '../../src/services/ProfileService.ts';
import type { PasswordHasher } from '../../src/services/AuthService.ts';
import {
	type PasswordChangeResult
} from '../../src/services/AuthService.ts';
import type { PasswordCredentialStore } from '../../src/repositories/AuthRepository.ts';
import { generate200Response } from '../../src/helper/generate200Response.ts';

const TEST_JWT_SECRET = 'password-route-test-secret';
process.env.JWT_SECRET = TEST_JWT_SECRET;
const { default: config } = await import('../../src/config/config.ts');
config.jwt.secret = TEST_JWT_SECRET;
const jwt = (await import('jsonwebtoken')).default;
const { AuthService } = await import('../../src/services/AuthService.ts');
const { createProfileRoute } = await import('../../src/routes/ProfileRoute.ts');
const authorization = `Bearer ${jwt.sign({ sub: 'dev' }, TEST_JWT_SECRET)}`;

class FakeProfileService implements Pick<ProfileService, 'getProfile' | 'updateProfile'> {
	async getProfile() { return generate200Response({}); }
	async updateProfile() { return generate200Response({}); }
}

class FakePasswordService implements Pick<InstanceType<typeof AuthService>, 'changePassword'> {
	calls: { userId: string; request: unknown }[] = [];

	async changePassword(userId: string, request: unknown): Promise<PasswordChangeResult> {
		this.calls.push({ userId, request });
		return {
			statusCode: 200,
			body: { success: true, message: 'Password changed successfully' }
		};
	}
}

class FakeCredentials implements PasswordCredentialStore {
	passwordHash: string | null = 'old-hash';
	reads: string[] = [];
	updates: { userId: string; currentHash: string; newHash: string }[] = [];

	async getUserPasswordHash(userId: string): Promise<string | null> {
		this.reads.push(userId);
		return this.passwordHash;
	}

	async updateUserPasswordHash(
		userId: string,
		currentHash: string,
		newHash: string
	): Promise<boolean> {
		this.updates.push({ userId, currentHash, newHash });
		if (this.passwordHash !== currentHash) return false;
		this.passwordHash = newHash;
		return true;
	}
}

class FakeHasher implements PasswordHasher {
	match = true;

	async compare(): Promise<boolean> {
		return this.match;
	}

	async hash(): Promise<string> {
		return 'new-hash';
	}
}

async function withServer(
	passwordService: Pick<InstanceType<typeof AuthService>, 'changePassword'>,
	run: (baseUrl: string) => Promise<void>
): Promise<void> {
	const app = express();
	app.use(express.json());
	app.use('/api/v1/profile', createProfileRoute(
		new ProfileController(new FakeProfileService()),
		new PasswordController(passwordService)
	));

	const server = app.listen(0);
	try {
		await new Promise<void>((resolve) => server.once('listening', resolve));
		const address = server.address() as AddressInfo;
		await run(`http://127.0.0.1:${address.port}`);
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => error ? reject(error) : resolve());
		});
	}
}

test('exposes authenticated PATCH /profile/password and accepts only the contract body', async () => {
	const passwords = new FakePasswordService();
	await withServer(passwords, async (baseUrl) => {
		const request = {
			currentPassword: 'old-password',
			newPassword: 'new-password-8'
		};
		const response = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), {
			success: true,
			message: 'Password changed successfully'
		});
		assert.deepEqual(passwords.calls, [{ userId: 'dev', request }]);
	});
});

test('validates input and integrates AuthService through the authenticated API', async () => {
	const credentials = new FakeCredentials();
	const hasher = new FakeHasher();
	const authService = new AuthService(credentials, hasher);

	await withServer(authService, async (baseUrl) => {
		const currentPassword = 'private-current-password';
		const newPassword = 'private-new-password';
		const response = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				currentPassword,
				newPassword,
				confirmPassword: newPassword
			})
		});
		const responseText = await response.text();

		assert.equal(response.status, 400);
		assert.equal(responseText.includes(currentPassword), false);
		assert.equal(responseText.includes(newPassword), false);
		assert.deepEqual(credentials.reads, []);
		assert.deepEqual(credentials.updates, []);

		const shortPassword = '12345';
		const shortResponse = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ currentPassword, newPassword: shortPassword })
		});
		const shortResponseText = await shortResponse.text();
		assert.equal(shortResponse.status, 400);
		assert.equal(shortResponseText.includes(currentPassword), false);
		assert.equal(shortResponseText.includes(shortPassword), false);
		assert.deepEqual(credentials.reads, []);
		assert.deepEqual(credentials.updates, []);

		hasher.match = false;
		const wrongCurrentPassword = 'private-wrong-current-password';
		const incorrectResponse = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				currentPassword: wrongCurrentPassword,
				newPassword
			})
		});
		const incorrectResponseText = await incorrectResponse.text();
		assert.equal(incorrectResponse.status, 400);
		assert.equal(incorrectResponseText.includes(wrongCurrentPassword), false);
		assert.equal(incorrectResponseText.includes(newPassword), false);
		assert.equal(credentials.passwordHash, 'old-hash');
		assert.deepEqual(credentials.updates, []);

		hasher.match = true;
		const successResponse = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ currentPassword, newPassword })
		});
		const successBody = await successResponse.json();

		assert.equal(successResponse.status, 200);
		assert.deepEqual(successBody, {
			success: true,
			message: 'Password changed successfully'
		});
		assert.equal(JSON.stringify(successBody).includes(currentPassword), false);
		assert.equal(JSON.stringify(successBody).includes(newPassword), false);
		assert.deepEqual(credentials.reads, ['dev', 'dev']);
		assert.deepEqual(credentials.updates, [{
			userId: 'dev',
			currentHash: 'old-hash',
			newHash: 'new-hash'
		}]);
	});
});

test('requires authentication and rejects unsupported methods', async () => {
	const passwords = new FakePasswordService();
	await withServer(passwords, async (baseUrl) => {
		const unauthorized = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				currentPassword: 'old-password',
				newPassword: 'new-password-8'
			})
		});
		assert.equal(unauthorized.status, 401);
		const bypass = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: { Authorization: 'Bearer MIKU_MIKU_OO_EE_OO', 'Content-Type': 'application/json' },
			body: JSON.stringify({ currentPassword: 'old-password', newPassword: 'new-password-8' })
		});
		assert.equal(bypass.status, 401);

		const methodNotAllowed = await fetch(`${baseUrl}/api/v1/profile/password`, {
			headers: { Authorization: authorization }
		});
		assert.equal(methodNotAllowed.status, 405);
		assert.equal(methodNotAllowed.headers.get('allow'), 'PATCH');
		assert.deepEqual(passwords.calls, []);
	});
});
