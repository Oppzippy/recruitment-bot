import * as Sentry from "@sentry/node";
import { Message } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { LeaderboardMessageGenerator } from "./LeaderboardMessageGenerator";
import { LeaderboardOptions } from "./LeaderboardOptions";

export class LeaderboardUpdater {
	private db: DataStore;
	private options: LeaderboardOptions;

	public constructor(db: DataStore, options: LeaderboardOptions) {
		this.db = db;
		this.options = options;
	}

	public async updateLeaderboard(message: Message): Promise<void> {
		const transaction = Sentry.startTransaction({
			name: "LeaderboardUpdater.updateLeaderboard",
			data: {
				guildId: message.guild.id,
				leaderboardOptions: this.options,
			},
		});
		const messageGenerator = await this.getMessageGenerator(
			message.guild.id,
		);
		await message.edit(
			messageGenerator.buildText(),
			messageGenerator.buildEmbed(),
		);
		transaction.finish();
	}

	public async getMessageGenerator(
		guildId: string,
	): Promise<LeaderboardMessageGenerator> {
		const scores = await this.db.recruiters.getRecruiterScores(guildId, {
			...this.options.filter,
		});
		return new LeaderboardMessageGenerator(scores, this.options);
	}
}
