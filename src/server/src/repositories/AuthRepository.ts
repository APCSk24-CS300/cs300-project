import {User} from "../types/UserRegistrationData.ts";
// import { Pool } from "pg";
// import "dotenv/config";
// import bcrypt from 'bcrypt';

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
               email: "example@mail.com",
               passwordPlainText: "thisispw"
           },
        passwordHash: "676767",
        signInTime: new Date(Date.now()),
        userStatus: 2,
        userRole: 1
       }
        
    ]
    constructor(db: string) {}

    public async getByUserID(id: string): Promise<User | null> {
        return this.db[0];
    }
}
