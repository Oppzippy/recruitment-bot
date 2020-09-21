import { addDays } from "date-fns";
import { MessageEmbed, Message } from "discord.js";
import { RecruitmentCount } from "../../external/database/models/RecruitmentCount";
import { InviteLinkFilter } from "../../external/database/repositories/RecruitmentInviteLinkRepository";
import { getCycleStartDate } from "../../util/date";

export interface InviteLeaderboardOptions {
	size: number;
	isDynamic?: boolean;
	filter?: InviteLinkFilter;
}

export class InviteLeaderboard {
	private message: Message;
	private options: InviteLeaderboardOptions;
	private dateFormat: Intl.DateTimeFormat;

	public constructor(message: Message, options: InviteLeaderboardOptions) {
		this.message = message;
		this.options = options;
		this.dateFormat = new Intl.DateTimeFormat(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZoneName: "short",
		});
	}

	/**
	 * Updates the message to match the current leaderboard data
	 * @param leaderboard Latest invite usage change for all recruiters
	 */
	public async update(leaderboard: RecruitmentCount[]): Promise<void> {
		const newText = this.buildText();
		const newEmbed = this.buildEmbed(leaderboard);
		await this.message.edit(newText, newEmbed);
	}

	private buildText(): string {
		if (this.options.filter?.startDate) {
			const filter = this.options.filter;
			const startDate = getCycleStartDate(
				filter.startDate,
				filter.resetIntervalInDays,
			);
			let message = `This leaderboard started on ${this.dateFormat.format(
				startDate,
			)}`;
			if (filter.resetIntervalInDays) {
				const endDate = addDays(startDate, filter.resetIntervalInDays);
				message += ` and will reset on ${this.dateFormat.format(
					endDate,
				)}`;
			}
			message += ".";
			return message;
		}
		return null;
	}

	public buildEmbed(leaderboard: RecruitmentCount[]): MessageEmbed {
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
