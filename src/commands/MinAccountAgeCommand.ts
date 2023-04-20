import { Command } from "@sapphire/framework";
import { PermissionsBitField } from "discord.js";

export class MinAccountAgeCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			name: "min_account_age",
			description:
				"Set a minimum age for accounts accepting invite links.",
			runIn: "GUILD_ANY",
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
				.addIntegerOption((option) =>
					option
						.setName("age-in-days")
						.setMinValue(0)
						.setMaxValue(10000)
						.setDescription(
							"Minimum account age to be counted when accepting invite links in days",
						)
						.setRequired(true),
				),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const minAge = interaction.options.getInteger("age-in-days");
		const dataStore = this.container.client.dataStore;
		dataStore.guildSettings.set(
			interaction.guildId,
			"minAccountAgeInDays",
			minAge,
		);
		await interaction.reply({
			content: `Set min account age in days to ${minAge}.`,
			ephemeral: true,
		});
	}
}
