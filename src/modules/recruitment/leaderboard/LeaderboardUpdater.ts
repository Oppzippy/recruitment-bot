import { Message } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import {
	LeaderboardMessageGenerator,
	LeaderboardOptions,
} from "./LeaderboardMessageGenerator";

export class LeaderboardUpdater {
	private db: DataStore;
	private options: LeaderboardOptions;

	public constructor(db: DataStore, options: LeaderboardOptions) {
		this.db = db;
		this.options = options;
	}

	public async updateLeaderboard(message: Message): Promise<void> {
		const messageGenerator = await this.getMessageGenerator(
			message.guild.id,
		);
		await message.edit(
			messageGenerator.buildText(),
			messageGenerator.buildEmbed(),
		);
	}

	public async getMessageGenerator(
		guildId: string,
	): Promise<LeaderboardMessageGenerator> {
		const scores = await this.db.inviteLinks.getRecruiterScores(
			guildId,
			this.options.filter,
		);
		return new LeaderboardMessageGenerator(scores, this.options);
	}
}
