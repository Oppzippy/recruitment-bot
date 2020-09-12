import { AkairoClient, CommandHandler } from "discord-akairo";
import * as path from "path";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/database/DataStore";

export class HuokanClient extends AkairoClient {
	public readonly configFile: ConfigurationFile;
	public readonly db: DataStore;

	private commandHandler: CommandHandler;

	constructor(configFile: ConfigurationFile, db: DataStore) {
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
