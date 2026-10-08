import 'dotenv/config';

const config: any = {
	client: {},
	server: {
		port: process.env.BACKEND_PORT
	},
	thirdparty: {},
	// db: {
	// 	dbHost: process.env.LOCAL_DB_HOST,
	// 	dbUser: process.env.LOCAL_DB_USER,
	// 	dbPassword: process.env.LOCAL_DB_PASSWORD,
	// 	dbName: process.env.LOCAL_DB_NAME,
	// 	dbPort: process.env.LOCAL_DB_PORT
	// },
	jwt: {
		secret: process.env.JWT_SECRET
	}
};

export default config;