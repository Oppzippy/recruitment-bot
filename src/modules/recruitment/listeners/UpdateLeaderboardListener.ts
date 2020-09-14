import { Listener } from "discord-akairo";
import { TextChannel, DiscordAPIError } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";
import { RecruitmentCount } from "../../../external/database/models/RecruitmentCount";
import { RecruitmentInviteLinkLeaderboard } from "../../../external/database/models/RecruitmentInviteLinkLeaderboard";
import { InviteLeaderboard } from "../InviteLeaderboard";

export class UpdateLeaderboardListener extends Listener {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("updateLeaderboard", {
			emitter: "recruitmentModule",
			event: "updateLeaderboard",
		});
		this.db = db;
	}

	public async exec(guildId: string) {
		const leaderboardRepo = this.db.inviteLeaderboardRepository;
		const inviteLinkRepo = this.db.recruitmentInviteLinkRepository;

		try {
			const [leaderboardMessages, recruitmentCount] = await Promise.all([
				leaderboardRepo.getLeaderboardMessages(guildId),
				inviteLinkRepo.getRecruiterRecruitmentCount(guildId),
			]);

			// XXX Switch to Promisme.allSettled
			// There is currently (as of 2020-09-14) a discord.js bug causing some promises to never resolve/reject
			// and just hang forever if we create them all at the same time.
			for (let leaderboardMessage of leaderboardMessages) {
				await this.updateLeaderboardMessage(
					leaderboardMessage,
					recruitmentCount,
				);
			}
		} catch (err) {
			console.error(`Error updating invite leaderboards: ${err}`);
		}
	}

	private async updateLeaderboardMessage(
		leaderboardMessage: RecruitmentInviteLinkLeaderboard,
		recruitmentCount: RecruitmentCount[],
	): Promise<void> {
		try {
			const channel = <TextChannel>(
				await this.client.channels.fetch(leaderboardMessage.channelId)
			);
			const message = await channel.messages.fetch(
				leaderboardMessage.messageId,
			);
			const leaderboard = new InviteLeaderboard(
				message,
				leaderboardMessage.size,
			);
			await leaderboard.update(recruitmentCount);
		} catch (err) {
			if (err instanceof DiscordAPIError && err.code == 10008) {
				// unknown channel/message
				await this.db.inviteLeaderboardRepository.deleteLeaderboardMessage(
					leaderboardMessage.channelId,
					leaderboardMessage.messageId,
				);
				console.log(
					`Removed deleted message from database: ${leaderboardMessage.messageId}`,
				);
			} else {
				throw err;
			}
		}
	}
}
