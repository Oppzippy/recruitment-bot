// eslint-disable-next-line @typescript-eslint/no-var-requires
import jsonfile from "jsonfile";
import rootPath from "app-root-path";
import path from "path";

const config = jsonfile.readFileSync(
	path.join(rootPath.toString(), "config.json"),
);

export default {
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
		client: config?.databaseConnection?.client,
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
