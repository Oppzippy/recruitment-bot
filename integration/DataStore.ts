import Knex = require("knex");
import * as knexStringcase from "knex-stringcase";
import { KnexDataStore } from "../src/external/database/KnexDataStore";

const knexConfig = {
	client: process.env.DB_CLIENT,
	connection: {
		timezone: "+00:00",
		host: process.env.DB_HOST,
		database: process.env.DB_DATABASE,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
	},
};

let dataStore: KnexDataStore;
let users = 0;
export function useDataStore(): KnexDataStore {
	if (!dataStore) {
		const knex = Knex(knexStringcase(knexConfig));
		dataStore = new KnexDataStore(knex);
		users = 0;
	}
	users++;
	return dataStore;
}

export function doneWithDataStore(): void {
	users--;
	if (users <= 0 && dataStore) {
		dataStore.destroy();
	}
}