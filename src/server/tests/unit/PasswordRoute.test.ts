import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';
import { createProfileRoute } from '../../src/routes/ProfileRoute.ts';
import type { ProfileService } from '../../src/services/ProfileService.ts';
import {
	AuthService,
	type PasswordHasher
} from '../../src/services/AuthService.ts';
import {
	type PasswordChangeResult
} from '../../src/services/AuthService.ts';
import type { PasswordCredentialStore } from '../../src/repositories/AuthRepository.ts';
import { generate200Response } from '../../src/helper/generate200Response.ts';

class FakeProfileService implements Pick<ProfileService, 'getProfile' | 'updateProfile'> {
	async getProfile() { return generate200Response({}); }
	async updateProfile() { return generate200Response({}); }
}

class FakePasswordService implements Pick<AuthService, 'changePassword'> {
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
	passwordService: Pick<AuthService, 'changePassword'>,
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
				Authorization: 'Bearer MIKU_MIKU_OO_EE_OO',
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

test('validates password-change input through the authenticated API before accessing credentials', async () => {
	const credentials = new FakeCredentials();
	const authService = new AuthService(credentials, new FakeHasher());

	await withServer(authService, async (baseUrl) => {
		const currentPassword = 'private-current-password';
		const newPassword = 'private-new-password';
		const response = await fetch(`${baseUrl}/api/v1/profile/password`, {
			method: 'PATCH',
			headers: {
				Authorization: 'Bearer MIKU_MIKU_OO_EE_OO',
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

		const methodNotAllowed = await fetch(`${baseUrl}/api/v1/profile/password`, {
			headers: { Authorization: 'Bearer MIKU_MIKU_OO_EE_OO' }
		});
		assert.equal(methodNotAllowed.status, 405);
		assert.equal(methodNotAllowed.headers.get('allow'), 'PATCH');
		assert.deepEqual(passwords.calls, []);
	});
});
