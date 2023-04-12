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
			bigNumberStrings: true,
			supportBigNumbers: true,
		},
		pool: {
			min: 1,
			max: 4,
		},
		migrations: {
			tableName: "knex_migrations",
		},
		seeds: {
			directory: "./seeds/development",
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
			bigNumberStrings: true,
			supportBigNumbers: true,
		},
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: "knex_migrations",
		},
		seeds: {
			directory: "./seeds/staging",
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
			bigNumberStrings: true,
			supportBigNumbers: true,
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
