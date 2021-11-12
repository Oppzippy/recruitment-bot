import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message } from "discord.js";

@ApplyOptions<CommandOptions>({
	name: "notifications",
	runIn: "DM",
})
export class UserSettingCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const dataStore = this.container.client.dataStore;
		let quietMode: boolean;
		if (!args.finished) {
			quietMode = (await args.pick("string")).toLowerCase() == "off";
		} else {
			quietMode = !(await dataStore.userSettings.get(
				message.author.id,
				"quiet",
			));
		}

		await dataStore.userSettings.set(message.author.id, "quiet", quietMode);
		await message.reply(
			`Notifications have been ${quietMode ? "disabled" : "enabled"}.`,
		);
	}
}
