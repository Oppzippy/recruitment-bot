import "source-map-support/register";
import * as process from "process";
import * as readline from "readline";
import * as Knex from "knex";
import * as knexStringcase from "knex-stringcase";
import * as dotenv from "dotenv";
import { HuokanClient } from "./HuokanClient";
import { KnexDataStore } from "./external/database/KnexDataStore";
import { HuokanAPI } from "./HuokanAPI";

dotenv.config();

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
const db = new KnexDataStore(knex);

const client = new HuokanClient(db);
client.login(process.env.DISCORD_TOKEN);

const api = new HuokanAPI(db);
api.listen();

async function destroy() {
	api.destroy();
	client.destroy();
	await knex.destroy();
}

process.on("SIGINT", destroy);
process.on("SIGTERM", destroy);

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.on("line", (line) => {
	switch (line) {
		case "stop":
		case "exit":
			destroy().then(() => process.exit(0));
			console.log("Stopping bot...");
			break;
	}
});
