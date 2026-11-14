import type { User } from "../types/UserRegistrationData.ts";

interface AuthRepository {
    getActiveUserID(): Promise<number>;

    getStudentUserID() : Promise<number>;

    getActivityManagerID(): Promise<number>;

    getAdminUserID(): Promise <number>;

    insertUser(user: User): Promise<void>;

    checkUserExists(id: string): Promise<boolean>;

    checkUserExistsWithEmail(email: string): Promise<boolean>;

    checkUserExistsWithPhoneNumber(phone: string): Promise<boolean>;

    getUserEmail(id: string): Promise<String>;

    getUserPasswordHash(id: string): Promise<string>;

    getUserRefreshTokenHash(id: string): Promise<string>;

    updateUserSessionToken(id: string, newSessionToken: string): Promise<void>;

}

class InMemoryAuthRepository implements AuthRepository {
    private readonly db: User[] = [
        {
            userID: "123",
            data: {
                name: "me",
                phone: "0123",
                email: "example@mail.com",
                passwordPlainText: "thisispw",
                enrollmentYear: 2024,
                majorFacultyID: 6767,
                createdAt: new Date('2024-09-16T14:30:00.000Z')
            },
            passwordHash: "676767",
            userStatus: 2,
            userRole: 1
        }
    ];

    public async getActiveUserID(): Promise<number> {
        return 0;
    }

    public async getStudentUserID(): Promise<number> {
        return 67;
    }

    public async getActivityManagerID(): Promise<number> {
        return 68;
    }

    public async getAdminUserID(): Promise<number> {
        return 69;
    }

    public async insertUser(user: User): Promise<void> {
        // insert user to db
    }

    public async checkUserExists(id: string): Promise<boolean> {
        return true;
    }

    public async checkUserExistsWithEmail(email: string): Promise<boolean> {
        return true;
    }

    public async checkUserExistsWithPhoneNumber(phone: string): Promise<boolean> {
        return true;
    }

    public async getUserEmail(id: string): Promise<String> {
        return (this.db[0].userID == id) ? this.db[0].data.email : "No matching email.";
    }
    
    public async getUserRefreshTokenHash(id: string): Promise<string> {
        return '#FF6920';
    }

    public async getUserPasswordHash(id: string): Promise<string> {
        return (this.db[0].userID ==  id) ? this.db[0].passwordHash : "no hash brown";
    }

    public async updateUserSessionToken(id: string, newSessionToken: string): Promise<void> {
        // delete old session row in Session table and add a new one
    }
}

const inMemoryAuthRepository = new InMemoryAuthRepository();
export default inMemoryAuthRepository;