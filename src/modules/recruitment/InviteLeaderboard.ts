import { MessageEmbed, Message } from "discord.js";
import { RecruitmentCount } from "../../external/database/models/RecruitmentCount";
import { InviteLinkFilter } from "../../external/database/repositories/RecruitmentInviteLinkRepository";

export interface InviteLeaderboardOptions {
	size: number;
	isDynamic?: boolean;
	filter?: InviteLinkFilter;
}

export class InviteLeaderboard {
	private message: Message;
	private options: InviteLeaderboardOptions;

	public constructor(message: Message, options: InviteLeaderboardOptions) {
		this.message = message;
		this.options = options;
	}

	/**
	 * Updates the message to match the current leaderboard data
	 * @param leaderboard Latest invite usage change for all recruiters
	 */
	public async update(leaderboard: RecruitmentCount[]): Promise<void> {
		const newMessageText = this.buildMessage(leaderboard);
		await this.message.edit(null, newMessageText);
	}

	public buildMessage(leaderboard: RecruitmentCount[]): MessageEmbed {
		const sortedLeaderboard = [...leaderboard].sort(
			(a, b) => b.count - a.count,
		);
		const total = sortedLeaderboard.reduce(
			(acc, curr) => acc + curr.count,
			0,
		);

		const embed = new MessageEmbed();
		embed.setTitle(
			`**Recruitment Leaderboard Top ${this.options.size}** (${total} total invites)`,
		);
		const messageContent = sortedLeaderboard
			.slice(0, this.options.size)
			.map(
				(recruitmentCount, i) =>
					`${i + 1}. <@${recruitmentCount.recruiterDiscordId}>: ${
						recruitmentCount.count
					}`,
			);
		if (sortedLeaderboard.length == 0) {
			messageContent.push("The leaderboard is empty.");
		}
		embed.setDescription(messageContent.join("\n"));
		if (this.options.isDynamic) {
			embed.setFooter("This message will be updated automatically.");
		}
		embed.setTimestamp(new Date());
		return embed;
	}
}
