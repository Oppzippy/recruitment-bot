import Knex = require("knex");
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { RecruitmentInviteLinkUsageChange } from "../models/RecruitmentInviteLinkUsageChange";

export class RecruitmentInviteLinkRespository {
	private db: Knex;

	constructor(db: Knex) {
		this.db = db;
	}

	async addRecruitmentInviteLink(
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

	async getRecruitmentInviteLinkByOwner(
		guildId: string,
		ownerId: string,
	): Promise<RecruitmentInviteLink> {
		return await this.db
			.select("*")
			.where({ guildId, ownerDiscordId: ownerId })
			.from<RecruitmentInviteLink>("recruitment_invite_link")
			.first();
	}

	async setRecruitmentLinkUsage(usage: Map<string, number>): Promise<void> {
		const insert = [];
		usage.forEach((uses, code) => {
			insert.push({
				inviteLink: code,
				numUses: uses,
			});
		});
		await this.db("recruitment_invite_link_usage_change").insert(insert);
	}

	async getRecruitmentLinkUsage(
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
}
