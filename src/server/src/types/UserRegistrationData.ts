// assume user data is like this
export interface UserData { // data to be input as registration
    name: string,
    email: string,
    phone: string,
    passwordPlainText: string,
    enrollmentYear: number,
    majorID: number,
    facultyID: number
}

export interface User { // data stored in db
    userID: string,
    data: UserData,
    passwordHash: string,
    signInTime: Date,
    userStatus: number,
    userRole: number
}