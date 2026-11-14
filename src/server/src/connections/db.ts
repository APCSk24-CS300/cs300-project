import { Pool } from 'pg';
import config from '../config/config.ts';

class DbConnection {
    pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: config.db.dbHost,
            user: config.db.dbUser,
            password: config.db.dbPassword,
            port: Number(config.db.dbPort ?? 5432),
            database: config.db.dbName,
        });
    }
}

export default new DbConnection();