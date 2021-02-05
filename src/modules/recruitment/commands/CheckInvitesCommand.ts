import { Command } from "discord-akairo";
import { TextChannel } from "discord.js";
import { EmbedField } from "discord.js";
import { MessageEmbed } from "discord.js";
import { Message } from "discord.js";
import { RecruitmentInviteLinkLeaderboard } from "../../../external/database/models/RecruitmentInviteLinkLeaderboard";
import { DataStore } from "../../../external/DataStore";
import { isDiscordNotFoundError } from "../../../util/DiscordUtils";

export class CheckInvitesCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("checkInvites", {
			aliases: ["checkinvites"],
			channel: "dm",
			cooldown: 120000,
			ratelimit: 2,
		});
		this.db = db;
	}

	public async exec(message: Message): Promise<void> {
		const guildIds = await this.db.inviteLinks.getGuildIdsOfUser(
			message.author.id,
		);
		const scoresByGuild = await Promise.all(
			guildIds.map(async (guildId) => ({
				guildId,
				leaderboards: await this.getLeaderboardsAndScoresByGuild(
					guildId,
					message.author.id,
				),
			})),
		);
		const embedPromises = scoresByGuild.map(async (guildLeaderboards) => {
			const guild = await this.client.guilds.fetch(
				guildLeaderboards.guildId,
			);
			const embed = new MessageEmbed();
			embed.setTitle(`Your Recruitment Score in ${guild.name}`);
			const fields = await Promise.all(
				guildLeaderboards.leaderboards.map((leaderboardScore) =>
					this.buildEmbedField(leaderboardScore),
				),
			);
			embed.addFields(fields);
			return embed;
		});
		const embeds = await Promise.all(embedPromises);
		await Promise.all(embeds.map((embed) => message.reply(embed)));
	}

	private async buildEmbedField(leaderboardScore: {
		leaderboard: RecruitmentInviteLinkLeaderboard;
		score: number;
	}): Promise<EmbedField> {
		try {
			const channel = await this.client.channels.fetch(
				leaderboardScore.leaderboard.channelId,
			);
			if (channel instanceof TextChannel) {
				return {
					name: `Leaderboard in #${channel.name}`,
					value: `${leaderboardScore.score ?? 0} invites`,
					inline: false,
				};
			}
		} catch (err) {
			if (!isDiscordNotFoundError(err)) {
				throw err;
			}
		}
	}

	private async getLeaderboardsAndScoresByGuild(
		guildId: string,
		userId: string,
	): Promise<
		{
			leaderboard: RecruitmentInviteLinkLeaderboard;
			score: number;
		}[]
	> {
		const leaderboards = await this.db.inviteLeaderboards.getLeaderboardMessages(
			{
				guildId,
			},
		);
		const promises = leaderboards.map(async (leaderboard) => {
			return {
				leaderboard,
				score: await this.getScoreFromLeaderboard(leaderboard, userId),
			};
		});
		return Promise.all(promises);
	}

	private async getScoreFromLeaderboard(
		leaderboard: RecruitmentInviteLinkLeaderboard,
		userId: string,
	): Promise<number> {
		const scores = await this.db.recruiters.getRecruiterScores(
			leaderboard.guildId,
			{
				...leaderboard.filter,
				userId,
			},
		);
		return scores[0]?.count;
	}
}
