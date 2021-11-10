import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command, CommandOptions } from "@sapphire/framework";
import { Message } from "discord.js";
import { VALID_SETTINGS } from "../../modules/settings/SettingsModule";

@ApplyOptions<CommandOptions>({
	name: "setting",
	runIn: "DM",
})
export class UserSettingCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const setting = await args.pick("string");
		const dataStore = this.container.client.dataStore;

		if (!VALID_SETTINGS.includes(setting)) {
			const settingValues = await Promise.all(
				VALID_SETTINGS.map((setting) =>
					dataStore.userSettings.get(message.author.id, setting),
				),
			);
			const settingText = VALID_SETTINGS.map(
				(setting, i) => `${setting}: ${settingValues[i] ?? false}`,
			);
			await message.reply(
				`Please specify a setting to toggle. Your settings are:\n${settingText.join(
					"\n",
				)}`,
			);
			return;
		}
		const value =
			(await dataStore.userSettings.get(message.author.id, setting)) ??
			false;
		await dataStore.userSettings.set(message.author.id, setting, !value);
		await message.reply(`${setting} has been set to ${!value}.`);
	}
}
