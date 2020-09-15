import {
	CommandHandler,
	InhibitorHandler,
	ListenerHandler,
} from "discord-akairo";
import { DataStore } from "../external/database/DataStore";
import { HuokanClient } from "../HuokanClient";

export abstract class Module {
	protected client: HuokanClient;
	protected db: DataStore;
	protected commandHandler: CommandHandler;
	protected listenerHandler: ListenerHandler;
	protected inhibitorHandler: InhibitorHandler;

	public constructor(client: HuokanClient, db?: DataStore) {
		this.client = client;
		this.db = db;
		this.commandHandler = new CommandHandler(client, {
			defaultCooldown: 1000,
		});
		this.listenerHandler = new ListenerHandler(client, {});
		this.inhibitorHandler = new InhibitorHandler(client, {});

		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
	}
}
