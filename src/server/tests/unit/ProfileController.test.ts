import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import type { ProfileService } from '../../src/services/ProfileService.ts';
import { generate200Response } from '../../src/helper/generate200Response.ts';
import { generate400Response } from '../../src/helper/generate400Response.ts';

interface ResponseCapture {
	statusCode?: number;
	body?: unknown;
	headers?: Record<string, string>;
}

class FakeProfileService implements Pick<ProfileService, 'getProfile' | 'updateProfile'> {
	readonly calls: { method: 'getProfile' | 'updateProfile', userId: string, body?: unknown }[] = [];

	async getProfile(userId: string) {
		this.calls.push({ method: 'getProfile', userId });
		return generate200Response({ id: userId });
	}

	async updateProfile(userId: string, body: unknown) {
		this.calls.push({ method: 'updateProfile', userId, body });
		return generate400Response('Only phoneNumber may be updated');
	}
}

function invoke(
	handler: (request: Request, response: Response) => Promise<void>,
	user: unknown,
	body?: unknown
): Promise<ResponseCapture> {
	const capture: ResponseCapture = {};
	const response = {
		locals: { user },
		status(code: number) {
			capture.statusCode = code;
			return this;
		},
		set(name: string, value: string) {
			capture.headers ??= {};
			capture.headers[name] = value;
			return this;
		},
		json(data: unknown) {
			capture.body = data;
			return this;
		}
	};
	return handler(
		{ body } as unknown as Request,
		response as unknown as Response
	).then(() => capture);
}

test('retrieves the user from verified auth context, not a request-supplied ID', async () => {
	const service = new FakeProfileService();
	const controller = new ProfileController(service);

	const result = await invoke(controller.getProfile, { sub: 'verified-user' }, { userId: 'attacker' });

	assert.equal(result.statusCode, 200);
	assert.deepEqual(service.calls, [{ method: 'getProfile', userId: 'verified-user' }]);
});

test('passes update body for service validation but derives owner only from auth context', async () => {
	const service = new FakeProfileService();
	const controller = new ProfileController(service);
	const body = { phoneNumber: '0901234567', userId: 'attacker', faculty: 'changed' };

	const result = await invoke(controller.updateProfile, { sub: 'verified-user' }, body);

	assert.equal(result.statusCode, 400);
	assert.deepEqual(service.calls, [{
		method: 'updateProfile',
		userId: 'verified-user',
		body
	}]);
});

test('rejects missing or malformed authenticated subject without calling the service', async () => {
	const service = new FakeProfileService();
	const controller = new ProfileController(service);

	for (const user of [undefined, {}, { sub: '' }, { sub: 123 }]) {
		const result = await invoke(controller.getProfile, user);
		assert.equal(result.statusCode, 401);
		assert.equal(result.headers?.['WWW-Authenticate'], 'Bearer realm="api"');
	}
	assert.deepEqual(service.calls, []);
});
