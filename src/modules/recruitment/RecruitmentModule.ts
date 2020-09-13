import { DataStore } from "../../external/database/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { InviteLeaderboardCommand } from "./commands/InviteLeaderboardCommand";
import InviteLinkCommand from "./commands/InviteLinkCommand";
import InviteAcceptListener from "./listeners/InviteAcceptListener";

export class RecruitmentModule extends Module {
	constructor(client: HuokanClient, db: DataStore) {
		super(client, db);
		this.registerCommands();
	}

	registerCommands() {
		this.commandHandler.register(new InviteLinkCommand(this.db));
		this.commandHandler.register(new InviteLeaderboardCommand(this.db));
	}

	registerListeners() {
		this.listenerHandler.register(new InviteAcceptListener(this.db));
	}
}
