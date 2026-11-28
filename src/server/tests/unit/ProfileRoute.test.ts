import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Profile } from '../../src/types/Profile.ts';
import type { ProfileRepository } from '../../src/repositories/ProfileRepository.ts';
import type { PhoneNumberAvailability } from '../../src/services/ProfileService.ts';
import type { PasswordChangeResult } from '../../src/services/AuthService.ts';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';
import { ProfileService } from '../../src/services/ProfileService.ts';

const TEST_JWT_SECRET = 'profile-route-test-secret';
process.env.JWT_SECRET = TEST_JWT_SECRET;

const jwt = (await import('jsonwebtoken')).default;
const { createProfileRoute } = await import('../../src/routes/ProfileRoute.ts');

function createProfile(id: string, fullName: string, phoneNumber: string): Profile {
	return {
		id,
		email: `${id}@example.edu`,
		fullName,
		phoneNumber,
		avatarUrl: null,
		academicInfo: null
	};
}

class FakeProfileStore implements Pick<ProfileRepository, 'getProfileByUserId' | 'updatePhoneNumber'> {
	readonly profiles = new Map<string, Profile>([
		['user-1', createProfile('user-1', 'User One', '0901234567')],
		['user-2', createProfile('user-2', 'User Two', '0907654321')]
	]);
	readonly reads: string[] = [];
	readonly updates: { userId: string; phoneNumber: string | null }[] = [];

	async getProfileByUserId(userId: string): Promise<Profile | null> {
		this.reads.push(userId);
		return this.profiles.get(userId) ?? null;
	}

	async updatePhoneNumber(userId: string, phoneNumber: string | null): Promise<Profile | null> {
		this.updates.push({ userId, phoneNumber });
		const profile = this.profiles.get(userId);
		if (!profile) return null;

		const updated = { ...profile, phoneNumber };
		this.profiles.set(userId, updated);
		return updated;
	}
}

class FakePhoneNumberAvailability implements PhoneNumberAvailability {
	async checkUserExistsWithPhoneNumber(): Promise<boolean> {
		return false;
	}
}

async function withServer(
	run: (baseUrl: string, profiles: FakeProfileStore) => Promise<void>
): Promise<void> {
	const profiles = new FakeProfileStore();
	const passwordController = new PasswordController({
		async changePassword(): Promise<PasswordChangeResult> {
			return {
				statusCode: 501,
				body: {
					success: false,
					code: 'NOT_IMPLEMENTED',
					message: 'Not part of this test'
				}
			};
		}
	});
	const app = express();
	app.use(express.json());
	app.use('/api/v1/profile', createProfileRoute(
		new ProfileController(new ProfileService(profiles, new FakePhoneNumberAvailability())),
		passwordController
	));

	const server = app.listen(0);
	try {
		await new Promise<void>((resolve) => server.once('listening', resolve));
		const address = server.address() as AddressInfo;
		await run(`http://127.0.0.1:${address.port}`, profiles);
	} finally {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => error ? reject(error) : resolve());
		});
	}
}

function authHeaders(userId: string): Record<string, string> {
	const token = jwt.sign({ sub: userId }, TEST_JWT_SECRET);
	return { Authorization: `Bearer ${token}` };
}

test('denies profile reads and updates without a valid bearer token', async () => {
	await withServer(async (baseUrl, profiles) => {
		for (const headers of [
			{},
			{ Authorization: 'Bearer invalid-token' },
			{ Authorization: 'Bearer MIKU_MIKU_OO_EE_OO' },
			{ Authorization: `Bearer ${jwt.sign({ sub: 'user-1' }, 'wrong-secret')}` },
			{ Authorization: `Bearer ${jwt.sign({ sub: 'user-1' }, TEST_JWT_SECRET, { expiresIn: -1 })}` },
			{ Authorization: `Bearer ${jwt.sign({}, TEST_JWT_SECRET)}` },
			{ Authorization: `${authHeaders('user-1').Authorization} extra` }
		]) {
			const read = await fetch(`${baseUrl}/api/v1/profile`, { headers });
			assert.equal(read.status, 401);

			const update = await fetch(`${baseUrl}/api/v1/profile`, {
				method: 'PATCH',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify({ phoneNumber: '0912345678' })
			});
			assert.equal(update.status, 401);
		}

		assert.deepEqual(profiles.reads, []);
		assert.deepEqual(profiles.updates, []);
	});
});

test('returns only the authenticated user profile and does not resolve a client-supplied target', async () => {
	await withServer(async (baseUrl, profiles) => {
		const response = await fetch(`${baseUrl}/api/v1/profile?userId=user-2`, {
			headers: authHeaders('user-1')
		});
		const body = await response.json() as {
			payload?: { data?: { id?: string; fullName?: string } };
		};

		assert.equal(response.status, 200);
		assert.equal(body.payload?.data?.id, 'user-1');
		assert.equal(body.payload?.data?.fullName, 'User One');
		assert.deepEqual(profiles.reads, ['user-1']);

		const otherProfile = await fetch(`${baseUrl}/api/v1/profile/user-2`, {
			headers: authHeaders('user-1')
		});
		assert.equal(otherProfile.status, 404);
		assert.deepEqual(profiles.reads, ['user-1']);
	});
});

test('rejects a client-supplied owner ID and updates only the authenticated user', async () => {
	await withServer(async (baseUrl, profiles) => {
		const headers = {
			...authHeaders('user-1'),
			'Content-Type': 'application/json'
		};
		const attemptedTransfer = await fetch(`${baseUrl}/api/v1/profile`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({
				phoneNumber: '0912345678',
				userId: 'user-2'
			})
		});

		assert.equal(attemptedTransfer.status, 400);
		assert.deepEqual(profiles.updates, []);
		assert.equal(profiles.profiles.get('user-2')?.phoneNumber, '0907654321');

		const validUpdate = await fetch(`${baseUrl}/api/v1/profile`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ phoneNumber: '0912345678' })
		});
		const body = await validUpdate.json() as {
			payload?: { data?: { id?: string; phoneNumber?: string } };
		};

		assert.equal(validUpdate.status, 200);
		assert.equal(body.payload?.data?.id, 'user-1');
		assert.equal(body.payload?.data?.phoneNumber, '0912345678');
		assert.deepEqual(profiles.updates, [{
			userId: 'user-1',
			phoneNumber: '0912345678'
		}]);
		assert.equal(profiles.profiles.get('user-2')?.phoneNumber, '0907654321');
	});
});

test('rejects invalid phone numbers and protected identity fields without changing the saved profile', async () => {
	await withServer(async (baseUrl, profiles) => {
		const headers = {
			...authHeaders('user-1'),
			'Content-Type': 'application/json'
		};
		const rejectedRequests = [
			{ phoneNumber: '12345' },
			{ phoneNumber: '+8490123456' },
			{ phoneNumber: '0901234567', fullName: 'Changed Name' },
			{ phoneNumber: '0901234567', studentNumber: '123456789' },
			{ phoneNumber: '0901234567', faculty: { id: 'other-faculty' } },
			{ phoneNumber: '0901234567', academicInfo: { faculty: { id: 'other-faculty' } } }
		];

		for (const body of rejectedRequests) {
			const response = await fetch(`${baseUrl}/api/v1/profile`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify(body)
			});

			assert.equal(response.status, 400);
			assert.equal(profiles.profiles.get('user-1')?.phoneNumber, '0901234567');
			assert.equal(profiles.profiles.get('user-2')?.phoneNumber, '0907654321');
		}

		assert.deepEqual(profiles.updates, []);
	});
});
