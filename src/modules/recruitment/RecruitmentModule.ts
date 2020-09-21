import { DiscordAPIError } from "discord.js";
import { EventEmitter } from "events";
import { DataStore } from "../../external/database/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { InviteChannelCommand } from "./commands/InviteChannelCommand";
import { InviteLeaderboardCommand } from "./commands/InviteLeaderboardCommand";
import { InviteLinkCommand } from "./commands/InviteLinkCommand";
import { InviteAcceptListener } from "./listeners/InviteAcceptListener";
import { UpdateLeaderboardListener } from "./listeners/UpdateLeaderboardListener";

export class RecruitmentModule extends Module {
	private emitter: EventEmitter;
	private inviteAcceptListener: InviteAcceptListener;

	public constructor(client: HuokanClient, db: DataStore) {
		super(client, db);
		this.emitter = new EventEmitter();
		this.listenerHandler.setEmitters({
			recruitmentModule: this.emitter,
		});
		this.registerCommands();
		this.registerListeners();

		db.inviteLeaderboardRepository.getGuilds().then(async (guilds) => {
			for (const guildId of guilds) {
				try {
					const guild = await client.guilds.fetch(guildId);
					await this.inviteAcceptListener.updateLeaderboardsIfNecessary(
						guild,
					);
				} catch (err) {
					if (
						!(err instanceof DiscordAPIError && err.code == 10008)
					) {
						console.log(`Error updating guild ${guildId}: `, err);
					}
				}
			}
		});
	}

	private registerCommands() {
		this.commandHandler.register(new InviteLinkCommand(this.db));
		this.commandHandler.register(new InviteLeaderboardCommand(this.db));
		this.commandHandler.register(new InviteChannelCommand(this.db));
	}

	private registerListeners() {
		this.inviteAcceptListener = new InviteAcceptListener(this.db);
		this.listenerHandler.register(this.inviteAcceptListener);
		this.listenerHandler.register(new UpdateLeaderboardListener(this.db));
	}
}
