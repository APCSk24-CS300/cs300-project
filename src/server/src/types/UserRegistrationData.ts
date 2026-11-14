// assume user registration data is like this
export interface RoleSpecificData {
    major_id?: string,
    faculty_id?: string,
    enrollment_year?: number,
    position_title?: string,
    office_name?: string
}

export interface UserRegistrationData {
    full_name: string,
    email: string,
    phone_number: string,
    role_id: number,
    role_data: RoleSpecificData,
    password_plain_text: string,
    granted_by_user_id: string,
    granted_at: Date,
}

export interface User { // data stored in db
    user_id: string,
    is_active: boolean,
    data: UserRegistrationData,
    password_hash: string,
    created_at: Date,
}