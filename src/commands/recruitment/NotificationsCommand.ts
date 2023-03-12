import { Command } from "@sapphire/framework";

export class UserSettingCommand extends Command {
	public constructor(context: Command.Context, options: Command.Options) {
		super(context, {
			...options,
			name: "notifications",
			description: "Toggle notifications",
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName(this.name).setDescription(this.description),
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction,
	) {
		const dataStore = this.container.client.dataStore;
		const quietMode = !(await dataStore.userSettings.get(
			interaction.user.id,
			"quiet",
		));

		await dataStore.userSettings.set(
			interaction.user.id,
			"quiet",
			quietMode,
		);
		await interaction.reply({
			content: `Notifications have been ${
				quietMode ? "disabled" : "enabled"
			}.`,
			ephemeral: true,
		});
	}
}
