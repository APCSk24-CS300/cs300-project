// assume user data is like this
interface UserData {
    name: string,
    email: string,
    phone: string,
}
interface User {
    userID: string,
    data: UserData,
    passwordHash: string,
    signInTime: Date,
    userStatus: number,
    userRole: number
}


