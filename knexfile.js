// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("./config.json");

module.exports = {
	development: {
		client: "sqlite3",
		connection: {
			filename: config.databaseConnection?.filename,
		},
	},

	// staging: {
	// 	client: "mysql",
	// 	connection: {
	// 		database: "huokan_discord_bot",
	// 		user: "username",
	// 		password: "password",
	// 	},
	// 	pool: {
	// 		min: 2,
	// 		max: 10,
	// 	},
	// 	migrations: {
	// 		tableName: "knex_migrations",
	// 	},
	// },

	production: {
		client: "mysql",
		connection: {
			host: config?.databaseConnection?.host,
			database: config?.databaseConnection?.database,
			user: config?.databaseConnection?.user,
			password: config?.databaseConnection?.password,
			port: config?.databaseConnection?.port,
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
