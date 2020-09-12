// Update with your config settings.

module.exports = {
	development: {
		client: "sqlite3",
		connection: {
			filename: "./db.sqlite",
		},
	},

	staging: {
		client: "mysql",
		connection: {
			database: "huokan_discord_bot",
			user: "username",
			password: "password",
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
		client: "mysql",
		connection: {
			database: "huokan_discord_bot",
			user: "username",
			password: "password",
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
