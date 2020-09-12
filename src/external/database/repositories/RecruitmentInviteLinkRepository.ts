import Knex = require("knex");
import { RecruitmentInviteLink } from "../models/RecruitmentInviteLink";

export class RecruitmentInviteLinkRespository {
	private db: Knex;

	constructor(db: Knex) {
		this.db = db;
	}

	async addRecruitmentInviteLink(
		guildId: string,
		inviteLink: string,
		ownerId: string,
	) {
		await this.db("recruitment_invite_link").insert({
			guildId,
			inviteLink,
			ownerDiscordId: ownerId,
		});
	}

	async getRecruitmentInviteLinkByOwner(guildId: string, ownerId: string) {
		return await this.db("recruitment_invite_link")
			.where({ guildId, ownerDiscordId: ownerId })
			.select("*")
			.from<RecruitmentInviteLink>("recruitment_invite_link")
			.first();
	}
}
