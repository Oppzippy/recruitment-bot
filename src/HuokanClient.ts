import { AkairoClient, CommandHandler } from "discord-akairo";
import Knex = require("knex");
import * as path from "path";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";

export class HuokanClient extends AkairoClient {
	private commandHandler: CommandHandler;
	private configFile: ConfigurationFile;
	private db: Knex;

	constructor(configFile: ConfigurationFile, db: Knex) {
		super(
			{
				ownerID: "191587255557554177",
			},
			{},
		);

		this.db = db;
		this.configFile = configFile;

		this.commandHandler = new CommandHandler(this, {
			directory: path.join(__dirname, "commands"),
			prefix: "!",
			blockBots: true,
			defaultCooldown: 1000,
		});

		this.commandHandler.loadAll();
	}

	reload() {
		this.commandHandler.reloadAll();
		this.configFile.reload();
	}
}
