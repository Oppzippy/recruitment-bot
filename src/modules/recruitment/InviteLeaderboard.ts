import { MessageEmbed } from "discord.js";
import { Message } from "discord.js";
import { RecruitmentCount } from "../../external/database/models/RecruitmentCount";

export class InviteLeaderboard {
	private message: Message;
	private size: number;

	constructor(message: Message, size: number) {
		this.message = message;
		this.size = size;
	}

	/**
	 * Updates the message to match the current leaderboard data
	 * @param leaderboard Latest invite usage change for all recruiters
	 */
	async update(leaderboard: RecruitmentCount[]): Promise<void> {
		const sortedLeaderboard = [...leaderboard].sort(
			(a, b) => b.count - a.count,
		);
		const newMessageText = this.buildMessage(sortedLeaderboard);
		await this.message.edit(null, newMessageText);
	}

	private buildMessage(sortedLeaderboard: RecruitmentCount[]): MessageEmbed {
		const total = sortedLeaderboard.reduce(
			(acc, curr) => acc + curr.count,
			0,
		);
		const messageContent = [];
		const embed = new MessageEmbed();
		embed.setTitle(
			`**Recruitment Leaderboard Top ${this.size}** (${total} total invites)`,
		);
		sortedLeaderboard.forEach((recruitmentCount, i) =>
			messageContent.push(
				`${i + 1}. <@${recruitmentCount.recruiterDiscordId}>: ${
					recruitmentCount.count
				}`,
			),
		);
		if (sortedLeaderboard.length == 0) {
			messageContent.push("The leaderboard is empty.");
		}
		embed.setDescription(messageContent.join("\n"));
		return embed;
	}
}
