import { Command } from "discord-akairo";
import { Message, TextChannel, DiscordAPIError } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { RecruitmentInviteLinkLeaderboard } from "../../../external/database/models/RecruitmentInviteLinkLeaderboard";
import {
	InviteLeaderboard,
	InviteLeaderboardOptions,
} from "../InviteLeaderboard";

interface InviteLeaderboardArgs {
	size: number;
	dynamic: boolean;
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
			],
			clientPermissions: ["MANAGE_GUILD"],
			userPermissions: ["MANAGE_GUILD"],
		});

		this.db = db;
	}

	public async exec(
		message: Message,
		args: InviteLeaderboardArgs,
	): Promise<void> {
		let { size } = args;
		if (size < 1) {
			size = 1;
		} else if (size > 50) {
			size = 50;
		}
		if (message.channel instanceof TextChannel) {
			try {
				const leaderboardMessage = await this.sendLeaderboard(
					message.channel,
					{ size: args.size, isDynamic: args.dynamic },
				);
				if (args.dynamic) {
					this.addDynamicLeaderboardMessage(leaderboardMessage, size);
				}
				this.deleteMessageIfPermissible(message);
				let dmChannel = message.author.dmChannel;
				if (!dmChannel) {
					dmChannel = await message.author.createDM();
				}
				dmChannel.send(
					`Created ${args.dynamic ? "dynamic " : ""}leaderboard in #${
						message.channel.name
					}.`,
				);
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
		const recruitmentCount = await inviteLinkRepo.getRecruiterRecruitmentCount(
			channel.guild.id,
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
		size: number,
	): Promise<void> {
		const leaderboardRepo = this.db.inviteLeaderboardRepository;
		const deletedMessages = await leaderboardRepo.getLeaderboardMessagesInChannel(
			leaderboardMessage.channel.id,
		);
		this.deleteLeaderboardMesssages(deletedMessages);
		await leaderboardRepo.deleteLeaderboardMessagesInChannel(
			leaderboardMessage.channel.id,
		);
		await leaderboardRepo.addLeaderboardMessage(
			leaderboardMessage.guild.id,
			leaderboardMessage.channel.id,
			leaderboardMessage.id,
			size,
		);
		deletedMessages;
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
			}
		}
	}
}
