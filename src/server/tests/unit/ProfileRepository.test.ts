import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ProfileQueryExecutor } from '../../src/repositories/ProfileRepository.ts';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.ts';

interface ProfileRowFixture {
	user_id: string;
	email: string;
	full_name: string;
	phone_number: string | null;
	avatar_url: string | null;
	student_user_id: string | null;
	faculty_id: string | null;
	faculty_code: string | null;
	faculty_name: string | null;
	major_name: string | null;
	enrollment_year: number | null;
}

class FakeProfileQueryExecutor implements ProfileQueryExecutor {
	readonly calls: { query: string, values?: (string | null)[] }[] = [];
	private readonly resultRows: ProfileRowFixture[][];

	constructor(resultRows: ProfileRowFixture[][]) {
		this.resultRows = resultRows;
	}

	async query(query: string, values?: (string | null)[]) {
		this.calls.push({ query, values });
		return { rows: this.resultRows.shift() ?? [] };
	}
}

function studentRow(overrides: Partial<ProfileRowFixture> = {}): ProfileRowFixture {
	return {
		user_id: 'student-1',
		email: 'student@example.edu',
		full_name: 'Student One',
		phone_number: '0901234567',
		avatar_url: null,
		student_user_id: 'student-1',
		faculty_id: 'faculty-1',
		faculty_code: 'SCI',
		faculty_name: 'Faculty of Science',
		major_name: 'Computer Science',
		enrollment_year: 2024,
		...overrides
	};
}

test('gets profile by supplied user ID with available academic data and no password hash', async () => {
	const executor = new FakeProfileQueryExecutor([[studentRow()]]);
	const repository = new ProfileRepository(executor);

	const profile = await repository.getProfileByUserId('student-1');

	assert.deepEqual(profile, {
		id: 'student-1',
		email: 'student@example.edu',
		fullName: 'Student One',
		phoneNumber: '0901234567',
		avatarUrl: null,
		academicInfo: {
			studentNumber: 'student-1',
			faculty: { id: 'faculty-1', code: 'SCI', name: 'Faculty of Science' },
			major: 'Computer Science',
			enrollmentYear: 2024
		}
	});
	assert.deepEqual(executor.calls[0].values, ['student-1']);
	assert.match(executor.calls[0].query, /LEFT JOIN "Student"/);
	assert.match(executor.calls[0].query, /LEFT JOIN "Faculty"/);
	assert.match(executor.calls[0].query, /LEFT JOIN "Major"/);
	assert.doesNotMatch(executor.calls[0].query, /password_hash/i);
});

test('returns null academic information for a user without a student record', async () => {
	const executor = new FakeProfileQueryExecutor([[
		studentRow({
			user_id: 'manager-1',
			student_user_id: null,
			faculty_id: null,
			faculty_code: null,
			faculty_name: null,
			major_name: null,
			enrollment_year: null
		})
	]]);
	const repository = new ProfileRepository(executor);

	const profile = await repository.getProfileByUserId('manager-1');

	assert.equal(profile?.academicInfo, null);
});

test('updates only phone number and returns the updated profile', async () => {
	const executor = new FakeProfileQueryExecutor([[studentRow({ phone_number: '0912345678' })]]);
	const repository = new ProfileRepository(executor);

	const profile = await repository.updatePhoneNumber('student-1', '0912345678');

	assert.equal(profile?.phoneNumber, '0912345678');
	assert.deepEqual(executor.calls[0].values, ['student-1', '0912345678']);
	assert.match(executor.calls[0].query, /SET phone_number = \$2\s+WHERE user_id = \$1/);
	assert.doesNotMatch(executor.calls[0].query, /password_hash/i);
});

test('returns null when the user does not exist during read or update', async () => {
	const executor = new FakeProfileQueryExecutor([[], []]);
	const repository = new ProfileRepository(executor);

	assert.equal(await repository.getProfileByUserId('missing-user'), null);
	assert.equal(await repository.updatePhoneNumber('missing-user', null), null);
});

test('propagates database failures', async () => {
	const executor: ProfileQueryExecutor = {
		async query() {
			throw new Error('database unavailable');
		}
	};
	const repository = new ProfileRepository(executor);

	await assert.rejects(repository.getProfileByUserId('student-1'), /database unavailable/);
});

test('a user with a Student row keeps the same student number even with staff duties', async () => {
 const row = studentRow({ user_id: 'student-manager', student_user_id: 'student-manager' });
 const profile = await new ProfileRepository(new FakeProfileQueryExecutor([[row]])).getProfileByUserId('student-manager');
 assert.equal(profile?.academicInfo?.studentNumber, 'student-manager');
});
