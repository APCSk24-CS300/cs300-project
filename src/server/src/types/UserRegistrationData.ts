// assume user data is like this
export interface UserData {
    name: string,
    email: string,
    phone: string,
    passwordPlainText: string
}
export interface User {
    userID: string,
    data: UserData,
    passwordHash: string,
    signInTime: Date,
    userStatus: number,
    userRole: number
}