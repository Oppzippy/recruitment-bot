import { addDays } from "date-fns";
import * as Knex from "knex";
import { getCycleStartDate } from "../../../util/date";
import { RecruitmentCount } from "../models/RecruitmentCount";
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { RecruitmentInviteLinkUsageChange } from "../models/RecruitmentInviteLinkUsageChange";

export interface InviteLinkFilter {
	startDate: Date;
	resetIntervalInDays?: number;
	now?: Date;
}

export class RecruitmentInviteLinkRespository {
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
	): Promise<RecruitmentCount[]> {
		const recruitmentCountByInviteLink = this.db
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
			.innerJoin(
				"recruitment_invite_link_usage_change",
				"recruitment_invite_link_usage_change.invite_link",
				"=",
				"recruitment_invite_link.invite_link",
			);
		const recruitmentCount = this.db
			.select({
				guildId: "guild_id",
				recruiterDiscordId: "owner_discord_id",
				count: this.db.sum("num_uses"),
			})
			.from<RecruitmentCount>(recruitmentCountByInviteLink)
			.groupBy("owner_discord_id");

		if (filter) {
			this.filterRecruiterScoresQueryBuilder(
				recruitmentCountByInviteLink,
				filter,
			);
		}
		// For some reason the original query doesn't return anything, but converting to string and back does
		// Probably a knex bug. This issue occurs as of 2020-09-19.
		return await this.db.raw(recruitmentCount.toString());
	}

	private filterRecruiterScoresQueryBuilder(
		queryBuilder: Knex.QueryBuilder,
		filter: InviteLinkFilter,
	) {
		const cycleStartDate = getCycleStartDate(
			filter.startDate,
			filter.resetIntervalInDays,
			filter.now,
		);
		queryBuilder
			.clearSelect()
			.select({
				guild_id: "recruitment_invite_link.guild_id",
				owner_discord_id: "recruitment_invite_link.owner_discord_id",
				num_uses: this.db.raw(
					`(${this.getNumUsesSubquery().toString()}) - COALESCE((
						SELECT num_uses FROM recruitment_invite_link_usage_change AS prev_usage
						WHERE prev_usage.invite_link = recruitment_invite_link.invite_link
						AND prev_usage.created_at < ?
						ORDER BY prev_usage.created_at DESC
						LIMIT 1
					), 0)`,
					cycleStartDate,
				),
			})
			.where(
				"recruitment_invite_link_usage_change.created_at",
				">=",
				cycleStartDate,
			);

		if (filter.resetIntervalInDays) {
			const cycleEndDate = addDays(
				cycleStartDate,
				filter.resetIntervalInDays,
			);
			queryBuilder.where(
				"recruitment_invite_link_usage_change.created_at",
				"<",
				cycleEndDate,
			);
		}
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
