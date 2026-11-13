// assume user registration data is like this
export interface UserRegistrationData {
    name: string,
    email: string,
    phone: string,
    passwordPlainText: string,
    enrollmentYear: number,
    majorFacultyID: number,
    createdAt: Date,
}

export interface User { // data stored in db
    userID: string,
    data: UserRegistrationData,
    passwordHash: string,
    userStatus: number,
    userRole: number,
}