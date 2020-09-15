import "source-map-support/register";
import * as process from "process";
import * as path from "path";
import * as readline from "readline";
import * as rootPath from "app-root-path";
import * as Knex from "knex";
import * as knexStringcase from "knex-stringcase";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { HuokanClient } from "./HuokanClient";
import { DataStore } from "./external/database/DataStore";

const configFile = new ConfigurationFile(
	path.join(rootPath.toString(), "config.json"),
);

configFile.load().then((config) => {
	const knexConfig = {
		client: config.databaseConnection.client,
		connection: {
			...config.databaseConnection,
			filename: path.join(
				rootPath.toString(),
				config.databaseConnection.filename,
			),
		},
	};
	const knex = Knex(knexStringcase(knexConfig));

	const client = new HuokanClient(new DataStore(knex));
	client.login(config.token);

	async function destroy() {
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
});
