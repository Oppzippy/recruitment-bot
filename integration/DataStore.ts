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

const knex = Knex(knexStringcase(knexConfig));

export const dataStore = new KnexDataStore(knex);
