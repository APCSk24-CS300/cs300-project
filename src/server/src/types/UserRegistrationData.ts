// assume user registration data is like this
export interface UserRegistrationData {
    name: string,
    email: string,
    phone: string,
    passwordPlainText: string,
    enrollmentYear: number,
    majorID: number,
    facultyID: number,
    createdAt: Date,
}
export interface User {
    userID: string,
    data: UserRegistrationData,
    passwordHash: string,
    userStatus: number,
    userRole: number,
}