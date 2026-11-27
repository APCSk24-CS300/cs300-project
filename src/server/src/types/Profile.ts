export interface FacultySummary {
	readonly id: string;
	readonly code: string;
	readonly name: string;
}

export interface AcademicInfo {
	readonly studentNumber: string | null;
	readonly faculty: FacultySummary | null;
	readonly major: string | null;
	readonly enrollmentYear: number | null;
}

export interface Profile {
	readonly id: string;
	readonly email: string;
	readonly fullName: string;
	readonly phoneNumber: string | null;
	readonly avatarUrl: string | null;
	readonly academicInfo: AcademicInfo | null;
}
