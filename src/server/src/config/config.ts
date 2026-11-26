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
	// db: {
	// 	dbHost: process.env.LOCAL_DB_HOST,
	// 	dbUser: process.env.LOCAL_DB_USER,
	// 	dbPassword: process.env.LOCAL_DB_PASSWORD,
	// 	dbName: process.env.LOCAL_DB_NAME,
	// 	dbPort: process.env.LOCAL_DB_PORT
	// },
	db: {
		dbHost: 'db',
		dbUser: process.env.POSTGRES_USER,
		dbPassword: process.env.POSTGRES_PASSWORD,
		dbName: process.env.POSTGRES_DB,
		dbPort: 5432
	},
	// AI module (specs/003-ai-assistant-safety). Runtime limits and switches live in
	// SystemSetting (ai.*), not here; these are secrets and connection details only.
	ai: {
		historySecret: process.env.AI_HISTORY_SECRET,
		db: {
			dbHost: 'db',
			dbUser: process.env.AI_DB_USER || 'ai_gateway',
			dbPassword: process.env.AI_DB_PASSWORD,
			dbName: process.env.POSTGRES_DB,
			dbPort: 5432
		},
		classifierModel: process.env.GEMINI_CLASSIFIER_MODEL || 'gemini-2.5-flash-lite',
		embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
	},
	jwt: {
		secret: process.env.JWT_SECRET
	}
};

export default config;