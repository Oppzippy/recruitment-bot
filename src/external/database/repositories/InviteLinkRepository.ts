import { addDays } from "date-fns";
import * as Knex from "knex";
import { getCycleStartDate } from "../../../util/Date";
import { RecruitmentScore } from "../models/RecruitmentScore";
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { RecruitmentInviteLinkUsageChange } from "../models/RecruitmentInviteLinkUsageChange";
import { InviteLinkFilter } from "../../../modules/recruitment/leaderboard/InviteLinkFilter";

export class InviteLinkRespository {
	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;
	}

	public async addRecruitmentInviteLink(
		guildId: string,
		inviteLink: string,
		ownerId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link").insert({
			guildId,
			inviteLink,
			ownerDiscordId: ownerId,
		});
	}

	public async getRecruitmentInviteLinkByOwner(
		guildId: string,
		ownerId: string,
	): Promise<RecruitmentInviteLink> {
		return await this.db
			.select("*")
			.where({ guildId, ownerDiscordId: ownerId })
			.from<RecruitmentInviteLink>("recruitment_invite_link")
			.first();
	}

	public async setRecruitmentLinkUsage(
		usage: Map<string, number>,
	): Promise<void> {
		const insert = [];
		usage.forEach((uses, code) => {
			insert.push({
				inviteLink: code,
				numUses: uses,
			});
		});
		await this.db("recruitment_invite_link_usage_change").insert(insert);
	}

	public async getRecruitmentLinkUsage(
		guildId: string,
	): Promise<Map<string, number>> {
		const query = this.db
			.select({
				id: "id",
				inviteLink: "invite_link",
				createdAt: "created_at",
				numUses: this.getNumUsesSubquery(),
			})
			.where("guild_id", "=", guildId)
			.from<RecruitmentInviteLinkUsageChange>("recruitment_invite_link");
		const links = await query;
		const usageByLink = new Map<string, number>();
		links.forEach((link) => usageByLink.set(link.inviteLink, link.numUses));
		return usageByLink;
	}

	public async getRecruiterScores(
		guildId: string,
		filter?: InviteLinkFilter,
	): Promise<RecruitmentScore[]> {
		const recruitmentScoreByInviteLink = this.db
			.select({
				guild_id: "recruitment_invite_link.guild_id",
				owner_discord_id: "recruitment_invite_link.owner_discord_id",
				num_uses: this.getNumUsesSubquery(),
			})
			.where("recruitment_invite_link.guild_id", "=", guildId)
			.groupBy(
				"recruitment_invite_link.guild_id",
				"recruitment_invite_link.invite_link",
			)
			.from("recruitment_invite_link")
			.as("recruitment_score_by_invite_link");
		const recruitmentScore = this.db
			.select({
				guildId: "guild_id",
				recruiterDiscordId: "owner_discord_id",
				count: this.db.raw("CAST(SUM(num_uses) AS SIGNED)"), // XXX mysql only. cast is necessary to get the correct type from the driver.
			})
			.having(this.db.raw("SUM(num_uses)"), ">", 0)
			.from<RecruitmentScore>(recruitmentScoreByInviteLink)
			.groupBy("owner_discord_id");

		if (filter) {
			this.filterRecruiterScoresQueryBuilder(
				recruitmentScoreByInviteLink,
				filter,
			);
		}
		// For some reason the original query doesn't return anything, but converting to string and back does
		// Probably a knex bug. This issue occurs as of 2020-09-19.
		// Possibly fixed as of 2020-09-21 by ensuring every subquery has a name.
		const scores = await recruitmentScore;
		return scores;
	}

	private filterRecruiterScoresQueryBuilder(
		queryBuilder: Knex.QueryBuilder,
		filter: InviteLinkFilter,
	) {
		const numUsesQuery = this.getNumUsesSubquery();
		let startDate: Date = filter.startDate;
		let endDate: Date = filter.endDate;
		if (filter.resetIntervalInDays) {
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

		const numUsesBeforeStartQuery = this.db
			.select("num_uses")
			.from({ prev_usage: "recruitment_invite_link_usage_change" })
			.where(
				"prev_usage.invite_link",
				"=",
				this.db.column("recruitment_invite_link.invite_link"),
			)
			.orderBy("prev_usage.created_at", "desc")
			.limit(1);

		if (startDate) {
			numUsesBeforeStartQuery.where(
				"prev_usage.created_at",
				"<",
				startDate.toISOString(),
			);
			numUsesQuery.where(
				"num_uses_subtable.created_at",
				">",
				startDate.toISOString(),
			);
		}

		if (endDate) {
			numUsesQuery.where(
				"num_uses_subtable.created_at",
				"<",
				endDate.toISOString(),
			);
		}

		queryBuilder.clearSelect().select({
			guild_id: "recruitment_invite_link.guild_id",
			owner_discord_id: "recruitment_invite_link.owner_discord_id",
			num_uses: startDate
				? this.db.raw(
						`(${numUsesQuery.toString()}) - COALESCE((${numUsesBeforeStartQuery.toString()}), 0)`,
						// XXX eslint error
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  )
				: numUsesQuery,
		});
	}

	private getNumUsesSubquery() {
		return this.db
			.select("num_uses")
			.from({ num_uses_subtable: "recruitment_invite_link_usage_change" })
			.whereRaw(
				"num_uses_subtable.invite_link = recruitment_invite_link.invite_link",
			)
			.orderBy("created_at", "desc")
			.limit(1);
	}
}
