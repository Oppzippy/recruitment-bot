import { randomUUID } from "crypto";
import { knex } from "knex";
import knexStringcase from "knex-stringcase";

const knexConfig = {
	client: process.env.DB_CLIENT,
	connection: {
		timezone: "+00:00",
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
		bigNumberStrings: true,
		supportBigNumbers: true,
	},
};

export async function useKnexInstance(name: string | undefined) {
	// Create the new db
	const customKnexConfig = {
		...knexConfig,
		connection: {
			...knexConfig.connection,
			// ensure valid table name
			database: `${randomUUID()}_${name ?? "MISSING_NAME"}`
				.replaceAll(" ", "_")
				.replaceAll(/[^A-Za-z0-9_]/g, "")
				.toLowerCase()
				.substring(0, 64),
		},
	};
	const knexInstance = knex(knexStringcase(knexConfig));
	await knexInstance.raw(
		"CREATE DATABASE ??",
		customKnexConfig.connection.database,
	);
	// Destroy connection with default db and create a new one with the correct db
	await knexInstance.destroy();

	const testKnexInstance = knex(knexStringcase(customKnexConfig));
	await testKnexInstance.migrate.latest();
	return testKnexInstance;
}
