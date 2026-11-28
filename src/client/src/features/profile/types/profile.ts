export interface Profile {
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  academicInfo: {
    studentNumber: string | null;
    faculty: {
      name: string;
    } | null;
  } | null;
}

export type ProfileResponseDTO =
  | {
      success: boolean;
      data: unknown;
    }
  | {
      success: boolean;
      payload: {
        message?: string;
        data?: unknown;
      };
    };
