import Knex = require("knex");
import { RecruitmentInviteLinkLeaderboard } from "../models/RecruitmentInviteLinkLeaderboard";

export class InviteLeaderboardRepository {
	private db: Knex;

	constructor(db: Knex) {
		this.db = db;
	}

	async addLeaderboardMessage(
		guildId: string,
		messageId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard").insert({
			guildId,
			messageId,
		});
	}

	async getLeaderboardMessages(guildId: string): Promise<string[]> {
		const messages = await this.db
			.select("messageId")
			.where({
				guildId,
			})
			.from<RecruitmentInviteLinkLeaderboard>(
				"recruitment_invite_link_leaderboard",
			);

		return messages.map((message) => message.messageId);
	}

	async deleteLeaderboardMessage(
		guildId: string,
		messageId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard")
			.where({
				guildId,
				messageId,
			})
			.delete();
	}
}
