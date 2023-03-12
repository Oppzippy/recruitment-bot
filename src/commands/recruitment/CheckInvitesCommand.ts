import { Command } from "@sapphire/framework";
import { EmbedField, EmbedBuilder, TextChannel } from "discord.js";
import { RecruitmentInviteLinkLeaderboard } from "../../external/database/models/RecruitmentInviteLinkLeaderboard";
import { isDiscordNotFoundError } from "../../util/DiscordUtils";

export class CheckInvitesCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			name: "checkinvites",
			cooldownDelay: 1000,
			description:
				"Check how many people you have invited to servers using RecruitmentBot.",
			requiredClientPermissions: ["SendMessages", "EmbedLinks"],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(true),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const dataStore = this.container.client.dataStore;
		const guildIds = await dataStore.inviteLinks.getGuildIdsOfUser(
			interaction.user.id,
		);
		const scoresByGuild = await Promise.all(
			guildIds.map(async (guildId) => ({
				guildId,
				leaderboards: await this.getLeaderboardsAndScoresByGuild(
					guildId,
					interaction.user.id,
				),
			})),
		);
		const embedPromises = scoresByGuild.map(async (guildLeaderboards) => {
			const guild = await this.container.client.guilds.fetch(
				guildLeaderboards.guildId,
			);
			const embed = new EmbedBuilder().setTitle(
				`Your Recruitment Score in ${guild.name}`,
			);
			const fields = await Promise.all(
				guildLeaderboards.leaderboards.map((leaderboardScore) =>
					this.buildEmbedField(leaderboardScore),
				),
			);
			embed.addFields(fields);
			return embed;
		});
		const embeds = await Promise.all(embedPromises);
		if (embeds.some((embed) => embed.data.fields.length > 0)) {
			await Promise.all(
				embeds.map((embed) =>
					interaction.reply({
						embeds: [embed],
						ephemeral: true,
					}),
				),
			);
		} else {
			await interaction.reply({
				content: "You don't appear on any invite leaderboards.",
				ephemeral: true,
			});
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
