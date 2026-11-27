import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';
import { createProfileRoute } from '../../src/routes/ProfileRoute.ts';
import type { ProfileService } from '../../src/services/ProfileService.ts';
import type { AuthService } from '../../src/services/AuthService.ts';
import {
	type PasswordChangeResult
} from '../../src/services/AuthService.ts';
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

async function withServer(
	run: (baseUrl: string, passwords: FakePasswordService) => Promise<void>
): Promise<void> {
	const passwords = new FakePasswordService();
	const app = express();
	app.use(express.json());
	app.use('/api/v1/profile', createProfileRoute(
		new ProfileController(new FakeProfileService()),
		new PasswordController(passwords)
	));

	const server = app.listen(0);
	try {
		await new Promise<void>((resolve) => server.once('listening', resolve));
		const address = server.address() as AddressInfo;
		await run(`http://127.0.0.1:${address.port}`, passwords);
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => error ? reject(error) : resolve());
		});
	}
}

test('exposes authenticated PATCH /profile/password and accepts only the contract body', async () => {
	await withServer(async (baseUrl, passwords) => {
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

test('requires authentication and rejects unsupported methods', async () => {
	await withServer(async (baseUrl, passwords) => {
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
