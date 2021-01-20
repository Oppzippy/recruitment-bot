import * as Sentry from "@sentry/node";
import { addDays } from "date-fns";
import Knex = require("knex");
import { InviteLinkFilter } from "../../../modules/recruitment/leaderboard/InviteLinkFilter";
import { getCycleStartDate } from "../../../util/Date";
import { KnexRepository } from "../KnexRepository";
import { RecruitmentScore } from "../models/RecruitmentScore";

export class RecruiterRepository extends KnexRepository {
	public async getRecruiterScoreByUser(
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore> {
		return await this.getRecruiterScoreSelect(filter).first();
	}

	public async getRecruiterScores(
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		const transaction = Sentry.startTransaction({
			name: "RecruiterRepository.getRecruiterScores",
			data: { filter },
		});
		const query = this.getRecruiterScoreSelect(filter);
		const scores = await query;
		transaction.finish();
		return scores;
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

	private getInviteLinkQuery(filter?: InviteLinkFilter): Knex.QueryBuilder {
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
			return this.getFilteredInviteLinkQuery(startDate, endDate, filter);
		}
		return this.getUsageBefore(endDate, filter);
	}

	private getFilteredInviteLinkQuery(
		startDate: Date,
		endDate?: Date,
		filter?: InviteLinkFilter,
	): Knex.QueryBuilder {
		return this.db
			.select({
				inviteLink: "end_data.invite_link",
				usage: this.db.raw(
					"end_data.usage - COALESCE(start_data.usage, 0)",
				),
			})
			.from(this.getUsageBefore(endDate, filter).as("end_data"))
			.leftJoin(
				this.db.raw(
					`(${this.getUsageBefore(
						startDate,
						filter,
					).toString()}) AS start_data`,
				),
				"end_data.invite_link",
				"=",
				"start_data.invite_link",
			);
	}

	// Date filters are ignored. endDate argument is used instead.
	private getUsageBefore(
		endDate?: Date,
		filter?: InviteLinkFilter,
	): Knex.QueryBuilder {
		const usageSubquery = this.db
			.select("num_uses_table.num_uses")
			.from({ num_uses_table: "recruitment_invite_link_usage_change" })
			.where(
				"num_uses_table.invite_link",
				"=",
				this.db.raw("num_uses_parent_table.invite_link"),
			)
			.orderBy("num_uses_table.created_at", "desc")
			.orderBy("num_uses_table.id", "desc")
			.limit(1);

		if (endDate) {
			usageSubquery.where(
				"num_uses_table.created_at",
				"<",
				endDate.toISOString(),
			);
		}

		const usageSubqueryString = `(${usageSubquery.toString()}) - COALESCE((${this.db
			.select("duplicates")
			.from(
				this.getDuplicatesBefore(endDate, filter).as(
					"duplicates_before",
				),
			)
			.whereRaw(
				"duplicates_before.invite_link = num_uses_parent_table.invite_link",
			)
			.toString()}), 0)`;
		const query = this.db
			.select({
				inviteLink: "num_uses_parent_table.invite_link",
				usage: this.db.raw(usageSubqueryString),
			})
			.from({
				num_uses_parent_table: "recruitment_invite_link_usage_change",
			})
			.innerJoin(
				{ num_uses_parent_ril: "recruitment_invite_link" },
				"num_uses_parent_table.invite_link",
				"=",
				"num_uses_parent_ril.invite_link",
			)
			.groupBy("num_uses_parent_table.invite_link");

		// Filter at the deepest part of the query for significant performance gains
		if (filter?.guildId) {
			query.where("num_uses_parent_ril.guild_id", "=", filter.guildId);
		}
		if (filter?.userId) {
			query.where(
				"num_uses_parent_ril.owner_discord_id",
				"=",
				filter.userId,
			);
		}

		return query;
	}

	private getDuplicatesBefore(
		endDate: Date,
		filter?: InviteLinkFilter,
	): Knex.QueryBuilder {
		const lastDuplicate = this.db
			.select("duplicates")
			.from({ rildc2: "recruitment_invite_link_duplicate_change" })
			.whereRaw("rildc2.invite_link = rildc.invite_link")
			.andWhereRaw(
				"rildc2.acceptee_discord_id = rildc.acceptee_discord_id",
			)
			.orderBy("rildc2.created_at", "desc")
			.orderBy("rildc2.id", "desc")
			.limit(1);
		if (endDate) {
			lastDuplicate.andWhere(
				"rildc2.created_at",
				"<",
				endDate.toISOString(),
			);
		}

		const byLinkAndUser = this.db
			.select({
				invite_link: "invite_link",
				duplicates: lastDuplicate,
			})
			.from({ rildc: "recruitment_invite_link_duplicate_change" })
			.groupBy(["invite_link", "acceptee_discord_id"]);

		const byLink = this.db
			.select({ invite_link: "invite_link" })
			.sum({ duplicates: "duplicates" })
			.from(byLinkAndUser.as("invite_link_user_duplicates"))

			.groupBy("invite_link");

		return byLink;
	}
}
