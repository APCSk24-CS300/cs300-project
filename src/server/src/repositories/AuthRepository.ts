import type { User } from "../types/UserRegistrationData.ts";
import DbConnection from "../connections/db.ts";

interface AuthRepository {

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

    public async getStudentUserID(): Promise<number> {
        const query = `
            SELECT role_id
            FROM "Role"
            WHERE code = 'student'
        `;
        const result = await DbConnection.pool.query<number>(query, []);
        return result.row[0] ?? null;
    }

    public async getActivityManagerID(): Promise<number> {
        const query = `
            SELECT role_id
            FROM "Role"
            WHERE code = 'manager'
        `;
        const result = await DbConnection.pool.query<number>(query, []);
        return result.row[0] ?? null;
    }

    public async getAdminUserID(): Promise<number> {
        const query = `
            SELECT role_id
            FROM "Role"
            WHERE code = 'administrator'
        `;
        const result = await DbConnection.pool.query<number>(query, []);
        return result.row[0] ?? null;
    }

    public async insertUser(user: User): Promise<void> {
        
    }

    public async checkUserExists(id: string): Promise<boolean> {
        const query = ` 
            SELECT *
            FROM "User"
            WHERE user_id = ${id}
        `;
        const result = await DbConnection.pool.query<User>(query, [id]);
        return result != null;
    }

    public async checkUserExistsWithEmail(email: string): Promise<boolean> {
        const query = ` 
            SELECT *
            FROM "User"
            WHERE email = ${email}
        `;
        const result = await DbConnection.pool.query<User>(query, [id]);
        return result != null;
    }

    public async checkUserExistsWithPhoneNumber(phone: string): Promise<boolean> {
        const query = ` 
            SELECT *
            FROM "User"
            WHERE phone_number = ${phone}
        `;
        const result = await DbConnection.pool.query<User>(query, [id]);
        return result != null;
    }

    public async getUserEmail(id: string): Promise<String> {
        const query = `
            SELECT email
            FROM "User"
            WHERE user_id = id
        `;
        const result = await DbConnection.pool.query<String>(query, [id]);
        return result.row[0] ?? null;
    }
    
    public async getUserRefreshTokenHash(id: string): Promise<string> {
        const query = `
            SELECT refresh_token_id
            FROM "User"
            WHERE user_id = id
        `;
        const result = await DbConnection.pool.query<String>(query, [id]);
        return result.row[0] ?? null;
    }

    public async getUserPasswordHash(id: string): Promise<string> {
        const query = `
            SELECT password_hash
            FROM "User"
            WHERE user_id = id
        `;
        const result = await DbConnection.pool.query<String>(query, [id]);
        return result.row[0] ?? null;
    }

    public async updateUserSessionToken(id: string, newSessionToken: string): Promise<void> {
        // delete old session row in Session table and add a new one
    }
}

const inMemoryAuthRepository = new InMemoryAuthRepository();
export default inMemoryAuthRepository;