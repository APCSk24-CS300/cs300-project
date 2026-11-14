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
    private  ROLE_IDS = {
        STUDENT: 1,
        MANAGER: 2,
        ADMINISTRATOR: 3
    }

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
 {
    const { data } = user;
    const { role_data } = data;

    if (!user.user_id?.trim()) {
        throw new Error("Invalid user_id");
    }

    if (!user.password_hash?.trim()) {
        throw new Error("Invalid password_hash");
    }

    if (
        !(user.created_at instanceof Date) ||
        Number.isNaN(user.created_at.getTime()) ||
        !(data.granted_at instanceof Date) ||
        Number.isNaN(data.granted_at.getTime())
    ) {
        throw new Error("Invalid timestamp");
    }

    if (
        data.role_id === this.ROLE_IDS.STUDENT &&
        (
            !role_data.faculty_id?.trim() ||
            !Number.isInteger(role_data.enrollment_year) ||
            (role_data.enrollment_year ?? 0) <= 0
        )
    ) {
        throw new Error("Invalid student data");
    }

    if (!Object.values(this.ROLE_IDS).some(id => id === data.role_id)) {
        throw new Error(`Unsupported role_id: ${data.role_id}`);
    }

    const client = await DbConnection.pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Insert user
        await client.query(
            `
            INSERT INTO "User" (
                user_id,
                is_active,
                email,
                phone_number,
                password_hash,
                full_name,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
                user.user_id,
                user.is_active,
                data.email,
                data.phone_number,
                user.password_hash,
                data.full_name,
                user.created_at,
            ]
        );

        // 2. Assign role
        await client.query(
            `
            INSERT INTO "UserRole" (
                user_id,
                role_id,
                granted_by_user_id,
                granted_at
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                user.user_id,
                data.role_id,
                data.granted_by_user_id,
                data.granted_at,
            ]
        );

        // 3. Insert role-specific data
        switch (data.role_id) {
            case this.ROLE_IDS.STUDENT:
                await client.query(
                    `
                    INSERT INTO "Student" (
                        user_id,
                        major_id,
                        faculty_id,
                        enrollment_year
                    )
                    VALUES ($1, $2, $3, $4)
                    `,
                    [
                        user.user_id,
                        role_data.major_id ?? null,
                        role_data.faculty_id,
                        role_data.enrollment_year,
                    ]
                );
                break;

            case this.ROLE_IDS.MANAGER:
                await client.query(
                    `
                    INSERT INTO "Manager" (
                        user_id,
                        position_title
                    )
                    VALUES ($1, $2)
                    `,
                    [
                        user.user_id,
                        role_data.position_title ?? null,
                    ]
                );
                break;

            case this.ROLE_IDS.ADMINISTRATOR:
                await client.query(
                    `
                    INSERT INTO "Administrator" (
                        user_id,
                        office_name,
                        position_title
                    )
                    VALUES ($1, $2, $3)
                    `,
                    [
                        user.user_id,
                        role_data.office_name ?? null,
                        role_data.position_title ?? null,
                    ]
                );
                break;
        }

        await client.query("COMMIT");
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // Preserve the original transaction error.
        }

        throw error;
    } finally {
        client.release();
    }
}
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
        const result = await DbConnection.pool.query<User>(query, [email]);
        return result != null;
    }

    public async checkUserExistsWithPhoneNumber(phone: string): Promise<boolean> {
        const query = ` 
            SELECT *
            FROM "User"
            WHERE phone_number = ${phone}
        `;
        const result = await DbConnection.pool.query<User>(query, [phone]);
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