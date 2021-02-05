import * as Sentry from "@sentry/node";
import { DiscordAPIError } from "discord.js";
import { EventEmitter } from "events";
import { DataStore } from "../../external/DataStore";
import { HuokanClient } from "../../HuokanClient";
import { Module } from "../Module";
import { LeaderboardManager } from "./leaderboard/LeaderboardManager";
import { DefaultChannelCommand } from "./commands/DefaultChannelCommand";
import { LeaderboardCommand } from "./commands/LeaderboardCommand";
import { LinkCommand } from "./commands/LinkCommand";
import { InviteLinkAcceptListener } from "./listeners/InviteLinkAcceptListener";
import { Constants } from "discord.js";
import { CheckInvitesCommand } from "./commands/CheckInvitesCommand";

export class RecruitmentModule extends Module {
	private emitter: EventEmitter;
	private inviteAcceptListener: InviteLinkAcceptListener;
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
		this.db.inviteLinks.getGuildIds().then(async (guildIds) => {
			for (const guildId of guildIds) {
				try {
					const guild = await this.client.guilds.fetch(guildId);
					await this.inviteAcceptListener.updateInvites(guild);
				} catch (err) {
					if (
						!(
							err instanceof DiscordAPIError &&
							err.code == Constants.APIErrors.UNKNOWN_MESSAGE
						)
					) {
						console.error(`Error updating guild ${guildId}: `, err);
						Sentry.captureException(err);
					}
				}
			}
		});
	}

	private registerCommands() {
		this.commandHandler.register(new LinkCommand());
		this.commandHandler.register(
			new LeaderboardCommand(this.db, this.leaderboardManager),
		);
		this.commandHandler.register(new DefaultChannelCommand(this.db));
		this.commandHandler.register(new CheckInvitesCommand(this.db));
	}

	private registerListeners() {
		this.inviteAcceptListener = new InviteLinkAcceptListener(
			this.db,
			this.leaderboardManager,
		);
		this.listenerHandler.register(this.inviteAcceptListener);
	}
}
