import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { InviteLeaderboard } from "../InviteLeaderboard";

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
		});

		this.db = db;
	}

	public async exec(message: Message, args: InviteLeaderboardArgs) {
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
					args.size,
				);
				if (args.dynamic) {
					const leaderboardRepo = this.db.inviteLeaderboardRepository;
					await leaderboardRepo.addLeaderboardMessage(
						leaderboardMessage.guild.id,
						leaderboardMessage.channel.id,
						leaderboardMessage.id,
					);
				}
			} catch (err) {
				console.error(err);
			}
		}
	}

	private async sendLeaderboard(
		channel: TextChannel,
		size: number,
	): Promise<Message> {
		const leaderboardMessage = await channel.send(
			"Fetching invite leaderboard...",
		);
		const inviteLinkRepo = this.db.recruitmentInviteLinkRepository;
		const recruitmentCount = await inviteLinkRepo.getRecruiterRecruitmentCount(
			channel.guild.id,
		);
		const leaderboard = new InviteLeaderboard(leaderboardMessage, size);
		await leaderboard.update(recruitmentCount);
		return leaderboardMessage;
	}
}
