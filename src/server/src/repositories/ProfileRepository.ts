import type { Profile } from '../types/Profile.ts';

interface ProfileQueryRow {
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

export interface ProfileQueryExecutor {
	query(query: string, values?: (string | null)[]): Promise<{ rows: ProfileQueryRow[] }>;
}

const PROFILE_COLUMNS = `
	u.user_id,
	u.email,
	u.full_name,
	u.phone_number,
	u.avatar_url,
	s.user_id AS student_user_id,
	f.faculty_id,
	f.code AS faculty_code,
	f.name AS faculty_name,
	m.name AS major_name,
	s.enrollment_year`;

const PROFILE_JOINS = `
	LEFT JOIN "Student" s ON s.user_id = u.user_id
	LEFT JOIN "Faculty" f ON f.faculty_id = s.faculty_id
	LEFT JOIN "Major" m ON m.major_id = s.major_id`;

function mapProfile(row: ProfileQueryRow): Profile {
	let academicInfo: Profile['academicInfo'] = null;

	if (row.student_user_id !== null) {
		if (
			row.faculty_id === null ||
			row.faculty_code === null ||
			row.faculty_name === null ||
			row.enrollment_year === null
		) {
			throw new Error(`Student academic data is incomplete for user ${row.user_id}`);
		}

		academicInfo = {
			// UC-03: a Student row uses its referenced User.user_id as the read-only student number.
			studentNumber: row.student_user_id,
			faculty: {
				id: row.faculty_id,
				code: row.faculty_code,
				name: row.faculty_name
			},
			major: row.major_name,
			enrollmentYear: row.enrollment_year
		};
	}

	return {
		id: row.user_id,
		email: row.email,
		fullName: row.full_name,
		phoneNumber: row.phone_number,
		avatarUrl: row.avatar_url,
		academicInfo
	};
}

/** Reads and updates the authenticated user's profile without accepting a target from the request body. */
export class ProfileRepository {
	private readonly pool: ProfileQueryExecutor;

	constructor(pool: ProfileQueryExecutor) {
		this.pool = pool;
	}

	async getProfileByUserId(userId: string): Promise<Profile | null> {
		const { rows } = await this.pool.query(
			`SELECT ${PROFILE_COLUMNS}
			 FROM "User" u
			 ${PROFILE_JOINS}
			 WHERE u.user_id = $1 AND u.is_active IS NOT FALSE`,
			[userId]);

		return rows[0] ? mapProfile(rows[0]) : null;
	}

	async updatePhoneNumber(userId: string, phoneNumber: string | null): Promise<Profile | null> {
		const { rows } = await this.pool.query(
			`WITH u AS (
				UPDATE "User"
				SET phone_number = $2
				WHERE user_id = $1 AND is_active IS NOT FALSE
				RETURNING user_id, email, full_name, phone_number, avatar_url
			)
			SELECT ${PROFILE_COLUMNS}
			FROM u
			${PROFILE_JOINS}`,
			[userId, phoneNumber]);

		return rows[0] ? mapProfile(rows[0]) : null;
	}
}
