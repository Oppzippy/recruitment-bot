import { HuokanClient } from "./HuokanClient";
import "source-map-support/register";
import * as process from "process";
import * as path from "path";
import * as rootPath from "app-root-path";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import Knex = require("knex");

const configFile = new ConfigurationFile(
	path.join(rootPath.toString(), "config.json"),
);

configFile.load().then((config) => {
	const knex = Knex({
		client: config.databaseConnection.client,
		connection: {
			filename: config.databaseConnection.filename,
		},
	});

	const client = new HuokanClient(configFile, knex);
	client.login(config.token); // TODO move to config

	function destroy() {
		client.destroy();
	}

	process.on("SIGINT", destroy);
	process.on("SIGTERM", destroy);
});
