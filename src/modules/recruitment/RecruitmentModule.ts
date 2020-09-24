import { DiscordAPIError } from "discord.js";
import { EventEmitter } from "events";
import { DataStore } from "../../external/database/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { LeaderboardManager } from "./leaderboard/LeaderboardManager";
import { DefaultChannelCommand } from "./commands/DefaultChannelCommand";
import { LeaderboardCommand } from "./commands/LeaderboardCommand";
import { LinkCommand } from "./commands/LinkCommand";
import { InviteLinkListener } from "./listeners/InviteLinkListener";

export class RecruitmentModule extends Module {
	private emitter: EventEmitter;
	private inviteAcceptListener: InviteLinkListener;
	private leaderboardManager: LeaderboardManager;

	public constructor(client: HuokanClient, db: DataStore) {
		super(client, db);
		this.leaderboardManager = new LeaderboardManager(client, db);
		this.emitter = new EventEmitter();
		this.listenerHandler.setEmitters({
			recruitmentModule: this.emitter,
		});
		this.registerCommands();
		this.registerListeners();

		this.refreshLeaderboards();
	}

	public async refreshLeaderboards(): Promise<void> {
		this.db.inviteLeaderboards.getGuilds().then(async (guilds) => {
			for (const guildId of guilds) {
				try {
					const guild = await this.client.guilds.fetch(guildId);
					await this.inviteAcceptListener.updateLeaderboardsIfNecessary(
						guild,
					);
				} catch (err) {
					if (
						!(err instanceof DiscordAPIError && err.code == 10008)
					) {
						console.error(`Error updating guild ${guildId}: `, err);
					}
				}
			}
		});
	}

	private registerCommands() {
		this.commandHandler.register(new LinkCommand(this.db));
		this.commandHandler.register(
			new LeaderboardCommand(this.db, this.leaderboardManager),
		);
		this.commandHandler.register(new DefaultChannelCommand(this.db));
	}

	private registerListeners() {
		this.inviteAcceptListener = new InviteLinkListener(
			this.db,
			this.leaderboardManager,
		);
		this.listenerHandler.register(this.inviteAcceptListener);
	}
}
