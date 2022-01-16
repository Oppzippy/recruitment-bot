import { addDays } from "date-fns";
import { RecruitmentScore } from "../../../external/database/models/RecruitmentScore";
import { getCycleStartDate } from "../../../util/Date";
import { LeaderboardOptions } from "./LeaderboardOptions";

export class LeaderboardMessageGenerator {
	private recruitmentScores: RecruitmentScore[];
	private options: LeaderboardOptions;
	private dateFormat: Intl.DateTimeFormat;

	public constructor(
		recruitmentScores: RecruitmentScore[],
		options: LeaderboardOptions,
	) {
		this.recruitmentScores = [...recruitmentScores].sort(
			(a, b) => b.count - a.count,
		);
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
		const totalInvites = this.recruitmentScores.reduce(
			(acc, curr) => acc + curr.count,
			0,
		);

		let message = "";
		const filter = this.options.filter;
		if (filter?.startDate) {
			const startDate = getCycleStartDate(
				filter.startDate,
				filter.resetIntervalInDays,
			);
			message += `The leaderboard started on ${this.dateFormat.format(
				startDate,
			)}`;
			if (filter.resetIntervalInDays) {
				const resetDate = addDays(
					startDate,
					filter.resetIntervalInDays,
				);
				message += ` and will reset on ${this.dateFormat.format(
					resetDate,
				)}`;
			}
			message += ".";
		}
		if (filter?.endDate) {
			message += ` The leaderboard will end on ${this.dateFormat.format(
				filter.endDate,
			)}`;
		}
		if (this.options.isDynamic) {
			message += " This message will update automatically.";
		}
		message += `\n\n**Recruitment Leaderboard Top ${this.options.size}** (${totalInvites} total invites)`;
		let leaderboard = this.recruitmentScores
			.slice(0, this.options.size)
			.map(
				(recruitmentCount, i) =>
					`${i + 1}. <@${recruitmentCount.recruiterDiscordId}>: ${
						recruitmentCount.count
					}`,
			)
			.join("\n");
		if (this.recruitmentScores.length == 0) {
			leaderboard = "The leaderboard is empty.";
		}

		message += `\n${leaderboard}`;

		return message.length == 0 ? null : message;
	}
}
