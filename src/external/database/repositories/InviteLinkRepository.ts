import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";
import { KnexRepository } from "../KnexRepository";

export class InviteLinkRespository extends KnexRepository {
	public async getOwnerId(inviteLink: string): Promise<string> {
		const row = await this.db("recruitment_invite_link")
			.select<RecruitmentInviteLink>("owner_discord_id")
			.where({ inviteLink })
			.first();
		return row?.ownerDiscordId;
	}

	public async logInviteLinkUse(
		userId: string,
		inviteLink?: string,
	): Promise<void> {
		await this.db("accepted_recruitment_invite_link").insert({
			accepteeDiscordId: userId,
			inviteLink: inviteLink,
		});
	}

	public async hasUserJoinedBefore(userId: string): Promise<boolean> {
		const row = await this.db("accepted_recruitment_invite_link")
			.select({
				count: this.db.count("*"),
			})
			.where({ accepteeDiscordId: userId })
			.first();
		return row && row.count >= 1;
	}

	public async addInviteLink(
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

	public async getInviteLinkByOwner(
		guildId: string,
		ownerId: string,
	): Promise<RecruitmentInviteLink> {
		return await this.db
			.select<RecruitmentInviteLink>("*")
			.where({
				"recruitment_invite_link.guild_id": guildId,
				ownerDiscordId: ownerId,
			})
			.from("recruitment_invite_link")
			.leftJoin(
				"setting",
				this.db.raw(
					`setting.setting_type = "guild" AND recruitment_invite_link.guild_id = setting.setting_group`,
				),
			)
			.where(function () {
				this.where("setting.setting", "=", "invite_channel")
					.andWhereRaw(
						"setting.updated_at <= recruitment_invite_link.created_at",
					)
					.orWhereNull("setting.setting");
			})
			.orderBy("recruitment_invite_link.created_at", "desc")
			.first();
	}

	public async setInviteLinkUsage(usage: Map<string, number>): Promise<void> {
		const insert = [];
		usage.forEach((uses, code) => {
			insert.push({
				inviteLink: code,
				numUses: uses,
			});
		});
		await this.db("recruitment_invite_link_usage_change").insert(insert);
	}

	public async getInviteLinkUsage(
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
			.from("recruitment_invite_link");
		const links = await query;
		const usageByLink = new Map<string, number>();
		links.forEach((link) => usageByLink.set(link.inviteLink, link.numUses));
		return usageByLink;
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
