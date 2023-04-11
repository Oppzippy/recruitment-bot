import { Command } from "@sapphire/framework";
import * as Sentry from "@sentry/node";
import { isValid, parseISO } from "date-fns";
import { PermissionsBitField, TextChannel } from "discord.js";
import { clamp } from "lodash";
import { LeaderboardOptions } from "../../modules/recruitment/leaderboard/LeaderboardOptions";

export class LeaderboardCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			name: "leaderboard",
			description: "Post a leaderboard in the current channel",
			runIn: "GUILD_ANY",
			cooldownDelay: 1000,
			requiredClientPermissions: [
				"ManageGuild",
				"SendMessages",
				"EmbedLinks",
			],
			requiredUserPermissions: ["ManageGuild"],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDMPermission(false)
				.setDefaultMemberPermissions(
					PermissionsBitField.Flags.ManageGuild,
				)
				.addNumberOption((option) =>
					option
						.setName("size")
						.setDescription(
							"Number of users to display on the leaderboard.",
						)
						.setMinValue(1)
						.setMaxValue(50)
						.setRequired(false),
				)
				.addStringOption((builder) =>
					builder
						.setName("start-date")
						.setDescription(
							"Start date and time in ISO 8601 format.",
						)
						.setRequired(false),
				)
				.addStringOption((builder) =>
					builder
						.setName("end-date")
						.setDescription("End date and time in ISO 8601 format.")
						.setRequired(false),
				)
				.addNumberOption((builder) =>
					builder
						.setName("reset-interval-in-days")
						.setDescription("Reset the leaderboard every x days")
						.setMinValue(1)
						.setMaxValue(365)
						.setRequired(false),
				)
				.addBooleanOption((builder) =>
					builder
						.setName("dynamic")
						.setDescription(
							"Dynamically update the leaderboard when the underlying data changes",
						)
						.setRequired(false),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const options = this.parseLeaderboardOptions(interaction);
		const channel = <TextChannel>await interaction.channel.fetch();
		try {
			this.container.client.recruitmentModule.leaderboardManager.postLeaderboard(
				channel,
				options,
			);
		} catch (err) {
			console.error(err);
			Sentry.captureException(err);
			interaction.reply({
				content: "An error has occurred while posting the leaderboard.",
				ephemeral: true,
			});
			return;
		}
		interaction.reply({
			content: "Ok, posted leaderboard.",
			ephemeral: true,
		});
	}

	private parseLeaderboardOptions(
		interaction: Command.ChatInputCommandInteraction,
	): LeaderboardOptions {
		const size = interaction.options.getNumber("size", false) ?? 10;
		const startDateISO = interaction.options.getString("start-date", false);
		const endDateISO = interaction.options.getString("end-date", false);
		const resetIntervalInDays = interaction.options.getNumber(
			"reset-interval-in-days",
			false,
		);
		const isDynamic = interaction.options.getBoolean("dynamic", false);

		const leaderboardOptions: LeaderboardOptions = {
			size: clamp(size, 1, 50),
			isDynamic,
		};

		if (startDateISO || endDateISO) {
			const startDate = startDateISO ? parseISO(startDateISO) : null;
			const endDate = endDateISO ? parseISO(endDateISO) : null;
			leaderboardOptions.filter = {
				startDate: isValid(startDate) ? startDate : null,
				endDate: isValid(endDate) ? endDate : null,
				resetIntervalInDays: resetIntervalInDays
					? clamp(resetIntervalInDays, 1, 365)
					: null,
			};
		}

		return leaderboardOptions;
	}
}
