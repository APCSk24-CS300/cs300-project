import 'dotenv/config';

const config: any = {
	client: {},
	server: {
		port: process.env.BACKEND_PORT
	},
	thirdparty: {},
	gemini: {
		apiKey: process.env.GEMINI_API_KEY,
		model: process.env.GEMINI_MODEL || process.env.GEMINI_BACKUP_MODEL,
		timeoutMs: 20000
	},
	db: {
		dbHost: 'db',
		dbUser: process.env.POSTGRES_USER,
		dbPassword: process.env.POSTGRES_PASSWORD,
		dbName: process.env.POSTGRES_DB,
		dbPort: 5432
	},
	jwt: {
		secret: process.env.JWT_SECRET
	}
};

export default config;