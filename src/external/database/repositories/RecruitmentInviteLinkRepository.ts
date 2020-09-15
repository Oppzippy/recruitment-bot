import * as Knex from "knex";
import { RecruitmentCount } from "../models/RecruitmentCount";
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { RecruitmentInviteLinkUsageChange } from "../models/RecruitmentInviteLinkUsageChange";

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
		const links = await this.db
			.select({
				id: "recruitment_invite_link_usage_change.id",
				inviteLink: "recruitment_invite_link_usage_change.invite_link",
				createdAt: "recruitment_invite_link_usage_change.created_at",
			})
			.max({ numUses: "recruitment_invite_link_usage_change.num_uses" })
			.innerJoin(
				"recruitment_invite_link_usage_change",
				"recruitment_invite_link.invite_link",
				"=",
				"recruitment_invite_link_usage_change.inviteLink",
			)
			.where("recruitment_invite_link.guild_id", "=", guildId)
			.groupBy("recruitment_invite_link.invite_link")
			.from<RecruitmentInviteLinkUsageChange>("recruitment_invite_link");
		const usageByLink = new Map<string, number>();
		links.forEach((link) => usageByLink.set(link.inviteLink, link.numUses));
		return usageByLink;
	}

	public async getRecruiterRecruitmentCount(
		guildId: string,
	): Promise<RecruitmentCount[]> {
		const recruitmentCount = await this.db
			.select({
				guildId: "recruitment_invite_link.guild_id",
				recruiterDiscordId: "recruitment_invite_link.owner_discord_id",
				count: this.db.max(
					"recruitment_invite_link_usage_change.num_uses",
				),
			})
			.where("recruitment_invite_link.guild_id", "=", guildId)
			.groupBy(
				"recruitment_invite_link.guild_id",
				"recruitment_invite_link.owner_discord_id",
			)
			.from<RecruitmentCount>("recruitment_invite_link")
			.innerJoin(
				"recruitment_invite_link_usage_change",
				"recruitment_invite_link_usage_change.invite_link",
				"=",
				"recruitment_invite_link.invite_link",
			);
		return recruitmentCount;
	}
}
