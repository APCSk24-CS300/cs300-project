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

interface UserRepository {
    getByUserID(id: string): Promise< User | null >
}

class InMemoryUserRepository {
    private db : User[] = [
       { 
        userID: "123",
        data: {
               name: "me",
               phone: "0123",
               email: "example@mail.com"
           },
        passwordHash: "676767",
        signInTime: new Date(Date.now()),
        userStatus: 2,
        userRole: 1
       }
        
    ]
    constructor(db: DatabaseConnection) {}

    public async getByUserID(id: string): Promise<User | null> {
        return this.db[0];
    }
}
