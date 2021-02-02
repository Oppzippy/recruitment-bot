import dotenv from "dotenv";
dotenv.config();

export default {
	development: {
		client: process.env.DB_CLIENT,
		connection: {
			host: process.env.DB_HOST,
			database: process.env.DB_DATABASE,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			port: process.env.DB_PORT,
		},
		pool: {
			min: 1,
			max: 4,
		},
		migrations: {
			tableName: "knex_migrations",
		},
	},

	staging: {
		client: process.env.DB_CLIENT,
		connection: {
			host: process.env.DB_HOST,
			database: process.env.DB_DATABASE,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			port: process.env.DB_PORT,
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: "knex_migrations",
		},
	},

	production: {
		client: process.env.DB_CLIENT,
		connection: {
			host: process.env.DB_HOST,
			database: process.env.DB_DATABASE,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			port: process.env.DB_PORT,
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: "knex_migrations",
		},
	},
};
