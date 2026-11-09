import type { User } from "../types/UserRegistrationData.ts";

export interface UserRepository {
    getByUserID(id: string): Promise<User | null>;
}

export class InMemoryUserRepository implements UserRepository {
    private readonly db: User[] = [
        {
            userID: "123",
            data: {
                name: "me",
                phone: "0123",
                email: "example@mail.com",
                passwordPlainText: "thisispw",
                enrollmentYear: 2024,
                majorID: 67,
                facultyID: 69
            },
            passwordHash: "676767",
            signInTime: new Date(),
            userStatus: 2,
            userRole: 1
        }
    ];

    public async getByUserID(id: string): Promise<User | null> {
        return this.db.find(user => user.userID === id) ?? null;
    }
}
