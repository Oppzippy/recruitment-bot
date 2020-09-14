import Knex = require("knex");
import { RecruitmentInviteLinkLeaderboard } from "../models/RecruitmentInviteLinkLeaderboard";

export class InviteLeaderboardRepository {
	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;
	}

	public async addLeaderboardMessage(
		guildId: string,
		channelId: string,
		messageId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard").insert({
			guildId,
			channelId,
			messageId,
		});
	}

	public async getLeaderboardMessages(
		guildId: string,
	): Promise<RecruitmentInviteLinkLeaderboard[]> {
		const messages = await this.db
			.select("*")
			.where({
				guildId,
			})
			.from<RecruitmentInviteLinkLeaderboard>(
				"recruitment_invite_link_leaderboard",
			);

		return messages;
	}

	public async deleteLeaderboardMessage(
		channelId: string,
		messageId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard")
			.where({
				channelId,
				messageId,
			})
			.delete();
	}
}
