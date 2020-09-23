import { addDays } from "date-fns";
import { MessageEmbed } from "discord.js";
import { RecruitmentScore } from "../../../external/database/models/RecruitmentScore";
import { InviteLinkFilter } from "../../../external/database/repositories/RecruitmentInviteLinkRepository";
import { getCycleStartDate } from "../../../util/Date";

export interface LeaderboardOptions {
	size: number;
	isDynamic?: boolean;
	filter?: InviteLinkFilter;
}

export class LeaderboardMessageGenerator {
	private recruitmentScores: RecruitmentScore[];
	private options: LeaderboardOptions;
	private dateFormat: Intl.DateTimeFormat;

	public constructor(
		recruitmentScores: RecruitmentScore[],
		options: LeaderboardOptions,
	) {
		this.recruitmentScores = recruitmentScores;
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

	public buildText(): string {
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

	public buildEmbed(): MessageEmbed {
		const sortedLeaderboard = [...this.recruitmentScores].sort(
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
