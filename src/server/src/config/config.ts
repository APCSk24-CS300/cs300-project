import 'dotenv/config';

const config: any = {
	client: {},
	server: {
		port: process.env.BACKEND_PORT
	},
	thirdparty: {},
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