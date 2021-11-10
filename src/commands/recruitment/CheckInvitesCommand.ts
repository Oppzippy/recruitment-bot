import { ApplyOptions } from "@sapphire/decorators";
import { Command, CommandOptions } from "@sapphire/framework";
import { EmbedField, Message, MessageEmbed, TextChannel } from "discord.js";
import { RecruitmentInviteLinkLeaderboard } from "../../external/database/models/RecruitmentInviteLinkLeaderboard";
import { isDiscordNotFoundError } from "../../util/DiscordUtils";

@ApplyOptions<CommandOptions>({
	name: "checkinvites",
	runIn: "DM",
	cooldownDelay: 120000,
	requiredClientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
})
export class CheckInvitesCommand extends Command {
	public async messageRun(message: Message) {
		const dataStore = this.container.client.dataStore;
		const guildIds = await dataStore.inviteLinks.getGuildIdsOfUser(
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
			const guild = await this.container.client.guilds.fetch(
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
		if (embeds.some((embed) => embed.fields.length > 0)) {
			await Promise.all(
				embeds.map((embed) =>
					message.reply({
						embeds: [embed],
					}),
				),
			);
		} else {
			await message.reply("You don't appear on any invite leaderboards.");
		}
	}

	private async buildEmbedField(leaderboardScore: {
		leaderboard: RecruitmentInviteLinkLeaderboard;
		score: number;
	}): Promise<EmbedField> {
		try {
			const channel = await this.container.client.channels.fetch(
				leaderboardScore.leaderboard.channelId,
			);
			if (channel instanceof TextChannel) {
				return {
					name: `Leaderboard in #${channel.name}`,
					value: `${leaderboardScore.score ?? 0} invite${
						leaderboardScore.score == 1 ? "" : "s"
					}`,
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
		const leaderboards =
			await this.container.client.dataStore.inviteLeaderboards.getLeaderboardMessages(
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
		const scores =
			await this.container.client.dataStore.recruiters.getRecruiterScores(
				leaderboard.guildId,
				{
					...leaderboard.filter,
					userId,
				},
			);
		return scores[0]?.count;
	}
}
