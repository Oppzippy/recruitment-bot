import { Command } from "discord-akairo";
import { Message, TextChannel, DiscordAPIError } from "discord.js";
import { clamp } from "lodash";
import { DataStore } from "../../../external/database/DataStore";
import { RecruitmentInviteLinkLeaderboard } from "../../../external/database/models/RecruitmentInviteLinkLeaderboard";
import {
	InviteLeaderboard,
	InviteLeaderboardOptions,
} from "../InviteLeaderboard";

interface InviteLeaderboardArgs {
	size: number;
	dynamic: boolean;
	startDate: Date;
	resetIntervalInDays: number;
}

export class InviteLeaderboardCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("inviteLeaderboard", {
			aliases: ["inviteleaderboard"],
			args: [
				{
					id: "size",
					type: "number",
					match: "option",
					flag: "--size",
					default: 10,
				},
				{
					id: "dynamic",
					match: "flag",
					flag: "--dynamic",
				},
				{
					id: "startDate",
					type: "date",
					match: "option",
					flag: "--startDate",
				},
				{
					id: "resetIntervalInDays",
					type: "integer",
					match: "option",
					flag: "--cycle",
				},
			],
			clientPermissions: ["MANAGE_GUILD", "SEND_MESSAGES", "EMBED_LINKS"],
			channel: "guild",
		});

		this.db = db;
	}

	public static userPermissions(message: Message): string {
		if (
			message.member.roles.cache.some((role) =>
				role.name.toLowerCase().startsWith("moderator"),
			)
		) {
			return null;
		}
		if (message.member.hasPermission("MANAGE_GUILD")) {
			return null;
		}
		return "MANAGE_GUILD";
	}

	public async exec(
		message: Message,
		args: InviteLeaderboardArgs,
	): Promise<void> {
		const options = this.getOptionsFromArgs(args);
		if (message.channel instanceof TextChannel) {
			try {
				const leaderboardMessage = await this.sendLeaderboard(
					message.channel,
					options,
				);
				if (args.dynamic) {
					this.addDynamicLeaderboardMessage(
						leaderboardMessage,
						options,
					);
				}
				this.deleteMessageIfPermissible(message);
			} catch (err) {
				console.error(err);
			}
		}
	}

	private async sendLeaderboard(
		channel: TextChannel,
		options: InviteLeaderboardOptions,
	): Promise<Message> {
		const leaderboardMessage = await channel.send(
			"Fetching invite leaderboard...",
		);
		const inviteLinkRepo = this.db.recruitmentInviteLinkRepository;
		const recruitmentCount = await inviteLinkRepo.getRecruiterScores(
			channel.guild.id,
			options.filter,
		);
		const leaderboard = new InviteLeaderboard(leaderboardMessage, options);
		await leaderboard.update(recruitmentCount);
		return leaderboardMessage;
	}

	private async deleteMessageIfPermissible(message: Message) {
		if (message.author == this.client.user) {
			message.delete();
		} else if (message.channel instanceof TextChannel) {
			if (
				message.channel
					.permissionsFor(this.client.user)
					.has("MANAGE_MESSAGES")
			) {
				await message.delete();
			}
		}
	}

	private async addDynamicLeaderboardMessage(
		leaderboardMessage: Message,
		options: InviteLeaderboardOptions,
	): Promise<void> {
		const leaderboardRepo = this.db.inviteLeaderboardRepository;
		const deletedMessages = await leaderboardRepo.getLeaderboardMessages({
			channelId: leaderboardMessage.channel.id,
		});
		this.deleteLeaderboardMesssages(deletedMessages);
		await leaderboardRepo.deleteLeaderboardMessagesInChannel(
			leaderboardMessage.channel.id,
		);
		await leaderboardRepo.addLeaderboardMessage(
			leaderboardMessage.guild.id,
			leaderboardMessage.channel.id,
			leaderboardMessage.id,
			options,
		);
	}

	private async deleteLeaderboardMesssages(
		messages: RecruitmentInviteLinkLeaderboard[],
	) {
		for (const leaderboardMessage of messages) {
			try {
				const channel = <TextChannel>(
					await this.client.channels.fetch(
						leaderboardMessage.channelId,
					)
				);
				const message = await channel.messages.fetch(
					leaderboardMessage.messageId,
				);
				await message.delete();
			} catch (err) {
				if (!(err instanceof DiscordAPIError && err.code == 10008)) {
					console.error(err);
				}
				console.error(err);
			}
		}
	}

	private getOptionsFromArgs(
		args: InviteLeaderboardArgs,
	): InviteLeaderboardOptions {
		const size = clamp(args.size, 1, 50);
		const options: InviteLeaderboardOptions = {
			size,
			isDynamic: args.dynamic,
		};
		if (args.startDate) {
			options.filter = {
				startDate: args.startDate,
				resetIntervalInDays: args.resetIntervalInDays,
			};
		}
		return options;
	}
}
