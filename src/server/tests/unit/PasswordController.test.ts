import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
	PasswordService,
	type PasswordChangeResult
} from '../../src/services/PasswordService.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';

interface ResponseCapture {
	statusCode?: number;
	body?: unknown;
	headers?: Record<string, string>;
}

class FakePasswordService implements Pick<PasswordService, 'changePassword'> {
	calls: { userId: string; request: unknown }[] = [];
	result: PasswordChangeResult = {
		statusCode: 200,
		body: { success: true, message: 'Password changed successfully' }
	};

	async changePassword(userId: string, request: unknown): Promise<PasswordChangeResult> {
		this.calls.push({ userId, request });
		return this.result;
	}
}

async function invoke(user: unknown, body: unknown): Promise<{
	capture: ResponseCapture;
	serviceCalls: FakePasswordService['calls'];
}> {
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
	const service = new FakePasswordService();
	const controller = new PasswordController(service);
	await controller.changePassword(
		{ body } as Request,
		response as unknown as Response
	);
	return { capture, serviceCalls: service.calls };
}

test('uses the verified subject as owner and passes only the request body to the service', async () => {
	const request = {
		currentPassword: 'old-password',
		newPassword: 'new-password-8'
	};
	const result = await invoke({ sub: 'verified-user' }, request);

	assert.equal(result.capture.statusCode, 200);
	assert.deepEqual(result.capture.body, {
		success: true,
		message: 'Password changed successfully'
	});
	assert.deepEqual(result.serviceCalls, [{
		userId: 'verified-user',
		request
	}]);
});

test('rejects a missing or malformed verified subject without calling the service', async () => {
	for (const user of [undefined, {}, { sub: '' }, { sub: 123 }]) {
		const result = await invoke(user, {
			currentPassword: 'old-password',
			newPassword: 'new-password-8'
		});
		assert.equal(result.capture.statusCode, 401);
		assert.equal(result.capture.headers?.['WWW-Authenticate'], 'Bearer realm="api"');
		assert.deepEqual(result.capture.body, {
			success: false,
			code: 'UNAUTHENTICATED',
			message: 'Authentication is required or the token is invalid'
		});
		assert.deepEqual(result.serviceCalls, []);
	}
});
