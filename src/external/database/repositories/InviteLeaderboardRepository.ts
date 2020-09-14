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
		return await this.db
			.select("*")
			.where({ guildId })
			.from<RecruitmentInviteLinkLeaderboard>(
				"recruitment_invite_link_leaderboard",
			);
	}

	public async getLeaderboardMessagesInChannel(
		channelId: string,
	): Promise<RecruitmentInviteLinkLeaderboard[]> {
		return await this.db
			.select("*")
			.where({ channelId })
			.from<RecruitmentInviteLinkLeaderboard>(
				"recruitment_invite_link_leaderboard",
			);
	}

	public async deleteLeaderboardMessage(
		channelId: string,
		messageId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard")
			.where({ channelId, messageId })
			.delete();
	}

	public async deleteLeaderboardMessagesInChannel(
		channelId: string,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard")
			.where({ channelId })
			.delete();
	}
}
