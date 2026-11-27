import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProfileService, type PhoneNumberAvailability } from '../../src/services/ProfileService.ts';
import type { ProfileRepository } from '../../src/repositories/ProfileRepository.ts';
import type { Profile } from '../../src/types/Profile.ts';

const profile: Profile = {
	id: 'user-1',
	email: 'user@example.edu',
	fullName: 'User One',
	phoneNumber: '0901234567',
	avatarUrl: null,
	academicInfo: null
};

class FakeProfileStore implements Pick<ProfileRepository, 'getProfileByUserId' | 'updatePhoneNumber'> {
	profile: Profile | null = profile;
	reads: string[] = [];
	updates: { userId: string, phoneNumber: string | null }[] = [];
	fail = false;

	async getProfileByUserId(userId: string) {
		if (this.fail) throw new Error('database unavailable');
		this.reads.push(userId);
		return this.profile?.id === userId ? this.profile : null;
	}

	async updatePhoneNumber(userId: string, phoneNumber: string | null) {
		if (this.fail) throw new Error('database unavailable');
		this.updates.push({ userId, phoneNumber });
		this.profile = { ...profile, id: userId, phoneNumber };
		return this.profile;
	}
}

class FakePhoneNumberAvailability implements PhoneNumberAvailability {
	taken = new Map<string, string[]>();
	checks: { phoneNumber: string, excludingUserId?: string }[] = [];
	fail = false;

	async checkUserExistsWithPhoneNumber(phoneNumber: string, excludingUserId?: string) {
		if (this.fail) throw new Error('database unavailable');
		this.checks.push({ phoneNumber, excludingUserId });
		return (this.taken.get(phoneNumber) ?? []).some(userId => userId !== excludingUserId);
	}
}

function createService() {
	const profiles = new FakeProfileStore();
	const phoneNumbers = new FakePhoneNumberAvailability();
	return { service: new ProfileService(profiles, phoneNumbers), profiles, phoneNumbers };
}

test('retrieves the authenticated user profile', async () => {
	const { service, profiles } = createService();

	const response = await service.getProfile('user-1');

	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.payload.data, profile);
	assert.deepEqual(profiles.reads, ['user-1']);
});

test('returns not found when the authenticated user has no profile', async () => {
	const { service, profiles } = createService();
	profiles.profile = null;

	const response = await service.getProfile('missing-user');

	assert.equal(response.statusCode, 404);
});

test('accepts supported domestic and international phone formats and excludes the caller from duplicate checks', async () => {
	const { service, profiles, phoneNumbers } = createService();

	for (const phoneNumber of ['0901234567', '+84901234567']) {
		const response = await service.updateProfile('user-1', { phoneNumber });
		assert.equal(response.statusCode, 200);
	}

	assert.deepEqual(profiles.updates, [
		{ userId: 'user-1', phoneNumber: '0901234567' },
		{ userId: 'user-1', phoneNumber: '+84901234567' }
	]);
	assert.deepEqual(phoneNumbers.checks, [
		{ phoneNumber: '0901234567', excludingUserId: 'user-1' },
		{ phoneNumber: '+84901234567', excludingUserId: 'user-1' },
		{ phoneNumber: '+84901234567', excludingUserId: 'user-1' },
		{ phoneNumber: '0901234567', excludingUserId: 'user-1' }
	]);
});

test('allows clearing the phone number with null without a duplicate lookup', async () => {
	const { service, profiles, phoneNumbers } = createService();

	const response = await service.updateProfile('user-1', { phoneNumber: null });

	assert.equal(response.statusCode, 200);
	assert.deepEqual(profiles.updates, [{ userId: 'user-1', phoneNumber: null }]);
	assert.deepEqual(phoneNumbers.checks, []);
});

test('rejects invalid phone formats without checking duplicates or updating', async () => {
	const { service, profiles, phoneNumbers } = createService();

	for (const phoneNumber of ['', '090123456', '+8490123456', '090-123-4567', 901234567]) {
		const response = await service.updateProfile('user-1', { phoneNumber });
		assert.equal(response.statusCode, 400);
	}

	assert.deepEqual(profiles.updates, []);
	assert.deepEqual(phoneNumbers.checks, []);
});

test('rejects protected identity fields and all other unsupported fields', async () => {
	const { service, profiles, phoneNumbers } = createService();

	for (const request of [
		{ phoneNumber: '0901234567', fullName: 'Changed Name' },
		{ studentNumber: '123456789' },
		{ academicInfo: { faculty: { id: 'other' } } },
		{ email: 'changed@example.edu' }
	]) {
		assert.equal((await service.updateProfile('user-1', request)).statusCode, 400);
	}

	assert.deepEqual(profiles.updates, []);
	assert.deepEqual(phoneNumbers.checks, []);
});

test('rejects duplicate numbers owned by another user', async () => {
	const { service, profiles, phoneNumbers } = createService();
	phoneNumbers.taken.set('+84901234567', ['other-user']);

	const response = await service.updateProfile('user-1', { phoneNumber: '+84901234567' });

	assert.equal(response.statusCode, 409);
	assert.deepEqual(phoneNumbers.checks, [
		{ phoneNumber: '+84901234567', excludingUserId: 'user-1' }
	]);
	assert.deepEqual(profiles.updates, []);
});

test('rejects equivalent numbers stored in the alternate format', async () => {
	const { service, profiles, phoneNumbers } = createService();
	phoneNumbers.taken.set('+84901234567', ['other-user']);

	const response = await service.updateProfile('user-1', { phoneNumber: '0901234567' });

	assert.equal(response.statusCode, 409);
	assert.deepEqual(phoneNumbers.checks, [
		{ phoneNumber: '0901234567', excludingUserId: 'user-1' },
		{ phoneNumber: '+84901234567', excludingUserId: 'user-1' }
	]);
	assert.deepEqual(profiles.updates, []);
});

test('does not reject the authenticated user’s existing number as a duplicate', async () => {
	const { service, profiles, phoneNumbers } = createService();
	phoneNumbers.taken.set('0901234567', ['user-1']);

	const response = await service.updateProfile('user-1', { phoneNumber: '0901234567' });

	assert.equal(response.statusCode, 200);
	assert.equal(profiles.updates.length, 1);
});

test('returns not found and skips phone lookup when the profile is missing', async () => {
	const { service, profiles, phoneNumbers } = createService();
	profiles.profile = null;

	const response = await service.updateProfile('missing-user', { phoneNumber: '0901234567' });

	assert.equal(response.statusCode, 404);
	assert.deepEqual(phoneNumbers.checks, []);
	assert.deepEqual(profiles.updates, []);
});

test('returns a generic unavailable response for repository failures without logging the error message', async () => {
	const { service, profiles } = createService();
	profiles.fail = true;
	const originalError = console.error;
	const logs: unknown[][] = [];
	console.error = (...args: unknown[]) => { logs.push(args); };

	try {
		const response = await service.updateProfile('user-1', { phoneNumber: '0901234567' });
		assert.equal(response.statusCode, 503);
		assert.equal(response.payload.message, 'Profile service is temporarily unavailable');
		assert.equal(JSON.stringify(logs).includes('database unavailable'), false);
	} finally {
		console.error = originalError;
	}
});
