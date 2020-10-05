import { addDays } from "date-fns";
import Knex = require("knex");
import { InviteLinkFilter } from "../../../modules/recruitment/leaderboard/InviteLinkFilter";
import { getCycleStartDate } from "../../../util/Date";
import { KnexRepository } from "../KnexRepository";
import { RecruitmentScore } from "../models/RecruitmentScore";

export class RecruiterRepository extends KnexRepository {
	public async getRecruiterScoreByUser(
		userId: string,
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore> {
		return await this.getRecruiterScoreSelect(filter)
			.where("recruitment_invite_link.owner_discord_id", "=", userId)
			.first();
	}

	public async getRecruiterScoresByGuild(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		return await this.getRecruiterScoreSelect(filter).where(
			"recruitment_invite_link.guild_id",
			"=",
			guildId,
		);
	}

	public async getRecruiterScores(
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		return await this.getRecruiterScoreSelect(filter);
	}

	private getRecruiterScoreSelect(filter?: InviteLinkFilter) {
		return this.db
			.select({
				guildId: "recruitment_invite_link.guild_id",
				recruiterDiscordId: "recruitment_invite_link.owner_discord_id",
				count: this.db.raw(
					"CAST(SUM(invite_link_count.usage) AS SIGNED)",
				),
			})
			.from("recruitment_invite_link")
			.innerJoin(
				this.db.raw(
					`(${this.getInviteLinkQuery(
						filter,
					).toString()}) AS invite_link_count`,
				),
				"recruitment_invite_link.invite_link",
				"=",
				"invite_link_count.invite_link",
			)
			.groupBy(
				"recruitment_invite_link.guild_id",
				"recruitment_invite_link.owner_discord_id",
			)
			.having("count", ">", "0");
	}

	private getInviteLinkQuery(filter: InviteLinkFilter): Knex.QueryBuilder {
		let startDate: Date = filter?.startDate;
		let endDate: Date = filter?.endDate;
		if (filter?.resetIntervalInDays) {
			startDate = getCycleStartDate(
				filter.startDate,
				filter.resetIntervalInDays,
				filter.now,
			);
			const cycleEndDate = addDays(startDate, filter.resetIntervalInDays);
			if (!endDate || cycleEndDate < endDate) {
				endDate = cycleEndDate;
			}
		}

		if (startDate) {
			return this.getFilteredInviteLinkQuery(startDate, endDate);
		}
		return this.getUsageBefore(endDate);
	}

	private getFilteredInviteLinkQuery(
		startDate: Date,
		endDate?: Date,
	): Knex.QueryBuilder {
		return this.db
			.select({
				inviteLink: "end_data.invite_link",
				usage: this.db.raw(
					"end_data.usage - COALESCE(start_data.usage, 0)",
				),
			})
			.from(this.getUsageBefore(endDate).as("end_data"))
			.leftJoin(
				this.db.raw(
					`(${this.getUsageBefore(
						startDate,
					).toString()}) AS start_data`,
				),
				"end_data.invite_link",
				"=",
				"start_data.invite_link",
			);
	}

	private getUsageBefore(endDate?: Date): Knex.QueryBuilder {
		const usageSubquery = this.db
			.select("num_uses_table.num_uses")
			.from({ num_uses_table: "recruitment_invite_link_usage_change" })
			.where(
				"num_uses_table.invite_link",
				"=",
				this.db.raw("num_uses_parent_table.invite_link"),
			)
			.orderBy("num_uses_table.created_at", "desc")
			.limit(1);
		if (endDate) {
			usageSubquery.andWhere(
				"num_uses_table.created_at",
				"<",
				endDate.toISOString(),
			);
		}
		return this.db
			.select({
				inviteLink: "num_uses_parent_table.invite_link",
				usage: this.db.raw(
					`(${usageSubquery.toString()}) - COALESCE(duplicate_invite.duplicates, 0)`,
				),
			})
			.leftJoin(
				"recruitment_invite_link_duplicates AS duplicate_invite",
				"num_uses_parent_table.invite_link",
				"=",
				"duplicate_invite.invite_link",
			)
			.from({
				num_uses_parent_table: "recruitment_invite_link_usage_change",
			})
			.groupBy(
				"num_uses_parent_table.invite_link",
				"duplicate_invite.duplicates",
			);
	}
}
