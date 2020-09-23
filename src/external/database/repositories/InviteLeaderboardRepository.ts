import * as Knex from "knex";
import { LeaderboardOptions } from "../../../modules/recruitment/leaderboard/LeaderboardOptions";
import {
	parseFilter,
	RecruitmentInviteLinkLeaderboard,
} from "../models/RecruitmentInviteLinkLeaderboard";

export class InviteLeaderboardRepository {
	private db: Knex;

	public constructor(db: Knex) {
		this.db = db;
	}

	public async addLeaderboardMessage(
		guildId: string,
		channelId: string,
		messageId: string,
		options: LeaderboardOptions,
	): Promise<void> {
		await this.db("recruitment_invite_link_leaderboard").insert({
			guildId,
			channelId,
			messageId,
			size: options.size,
			filter: JSON.stringify(options.filter),
		});
	}

	public async getLeaderboardMessages(filter: {
		guildId?: string;
		channelId?: string;
	}): Promise<RecruitmentInviteLinkLeaderboard[]> {
		const query = this.db
			.select("*")
			.where(filter)
			.from("recruitment_invite_link_leaderboard");
		const leaderboards = await query;
		return leaderboards.map((leaderboard) => {
			if (leaderboard.filter) {
				return {
					...leaderboard,
					filter: parseFilter(leaderboard.filter),
				};
			}
			return leaderboard;
		});
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

	public async getGuilds(): Promise<string[]> {
		const rows = await this.db("recruitment_invite_link_leaderboard")
			.select("guild_id")
			.groupBy("guild_id");
		return rows.map((row) => row.guildId);
	}
}
