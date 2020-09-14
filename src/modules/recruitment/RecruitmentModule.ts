import { EventEmitter } from "events";
import { DataStore } from "../../external/database/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { InviteLeaderboardCommand } from "./commands/InviteLeaderboardCommand";
import InviteLinkCommand from "./commands/InviteLinkCommand";
import InviteAcceptListener from "./listeners/InviteAcceptListener";
import { UpdateLeaderboardListener } from "./listeners/UpdateLeaderboardListener";

export class RecruitmentModule extends Module {
	private emitter: EventEmitter;

	constructor(client: HuokanClient, db: DataStore) {
		super(client, db);
		this.emitter = new EventEmitter();
		this.listenerHandler.setEmitters({
			recruitmentModule: this.emitter,
		});
		this.registerCommands();
		this.registerListeners();
	}

	registerCommands() {
		this.commandHandler.register(new InviteLinkCommand(this.db));
		this.commandHandler.register(
			new InviteLeaderboardCommand(this.db, this.emitter),
		);
	}

	registerListeners() {
		this.listenerHandler.register(new InviteAcceptListener(this.db));
		this.listenerHandler.register(new UpdateLeaderboardListener(this.db));
	}
}
