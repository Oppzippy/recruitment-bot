import * as Sentry from "@sentry/node";
import { Guild, Client } from "discord.js";
import { TextChannel, Message } from "discord.js";
import { DataStore } from "../../../database/DataStore";
import { RecruitmentInviteLinkLeaderboard } from "../../../database/models/RecruitmentInviteLinkLeaderboard";
import { isDiscordNotFoundError } from "../../../util/DiscordUtils";
import { LeaderboardOptions } from "./LeaderboardOptions";
import { LeaderboardUpdater } from "./LeaderboardUpdater";

export class LeaderboardManager {
	private client: Client;
	private db: DataStore;

	public constructor(client: Client, db: DataStore) {
		this.client = client;
		this.db = db;
	}

	public async postLeaderboard(
		channel: TextChannel,
		options: LeaderboardOptions,
	): Promise<Message> {
		if (options.isDynamic) {
			await this.staticifyOldLeaderboards(channel);
			await this.db.inviteLeaderboards.deleteLeaderboardMessagesInChannel(
				channel.id,
			);
		}
		const updater = new LeaderboardUpdater(this.db, options);
		const generator = await updater.getMessageGenerator(channel.guild.id);
		const message = await channel.send({
			content: generator.buildText(),
			embeds: [generator.buildEmbed()],
		});
		if (options.isDynamic) {
			await this.db.inviteLeaderboards.addLeaderboardMessage(
				channel.guild.id,
				channel.id,
				message.id,
				options,
			);
		}
		return message;
	}

	private async staticifyOldLeaderboards(channel: TextChannel) {
		const leaderboards =
			await this.db.inviteLeaderboards.getLeaderboardMessages({
				channelId: channel.id,
			});
		const promises = leaderboards.map((leaderboard) =>
			this.updateLeaderboard(leaderboard, false),
		);
		await Promise.allSettled(promises);
	}

	public async updateLeaderboardsForGuild(guild: Guild): Promise<void> {
		const leaderboards =
			await this.db.inviteLeaderboards.getLeaderboardMessages({
				guildId: guild.id,
			});
		const messagePromises = leaderboards.map((leaderboard) =>
			this.updateLeaderboard(leaderboard, true),
		);
		await Promise.allSettled(messagePromises);
	}

	public async updateLeaderboard(
		leaderboard: RecruitmentInviteLinkLeaderboard,
		isDynamic: boolean, // TODO put in RecruitmentInviteLinkLeaderboard
	): Promise<void> {
		try {
			// TODO delete messages from deleted channels
			const channel = await this.client.channels.fetch(
				leaderboard.channelId,
			);
			if (channel instanceof TextChannel) {
				const message = await channel.messages.fetch(
					leaderboard.messageId,
				);
				await this.updateLeaderboardMessage(message, {
					size: leaderboard.size,
					isDynamic,
					filter: leaderboard.filter,
				});
			}
		} catch (err) {
			if (isDiscordNotFoundError(err)) {
				this.db.inviteLeaderboards.deleteLeaderboardMessage(
					leaderboard.channelId,
					leaderboard.messageId,
				);
			} else {
				console.error(err);
				Sentry.captureException(err);
			}
		}
	}

	public async updateLeaderboardMessage(
		message: Message,
		options: LeaderboardOptions,
	): Promise<void> {
		const updater = new LeaderboardUpdater(this.db, options);
		await updater.updateLeaderboard(message);
	}
}
