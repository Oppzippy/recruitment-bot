import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import * as path from "path";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/database/DataStore";

export class HuokanClient extends AkairoClient {
	public readonly configFile: ConfigurationFile;
	public readonly db: DataStore;

	private commandHandler: CommandHandler;
	private listenerHandler: ListenerHandler;

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

		this.listenerHandler = new ListenerHandler(this, {
			directory: path.join(__dirname, "listeners"),
		});

		this.commandHandler.useListenerHandler(this.listenerHandler);

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
	}

	reload(): void {
		this.commandHandler.reloadAll();
		this.listenerHandler.reloadAll();
		this.configFile.reload();
	}
}
