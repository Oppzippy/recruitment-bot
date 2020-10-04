import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { DataStore } from "../../../external/DataStore";
import { VALID_SETTINGS as USER_SETTINGS } from "../SettingsModule";

type UserSettingArgs = {
	setting: string;
	value: string;
};

export class UserSettingCommand extends Command {
	private db: DataStore;
	constructor(db: DataStore) {
		super("userSetting", {
			aliases: ["setting"],
			channel: "dm",
			args: [
				{
					id: "setting",
					type: "string",
					default: null,
				},
			],
		});
		this.db = db;
	}

	public async exec(message: Message, args: UserSettingArgs): Promise<void> {
		if (!USER_SETTINGS.includes(args.setting)) {
			const settingValues = await Promise.all(
				USER_SETTINGS.map((setting) =>
					this.db.userSettings.get(message.author.id, setting),
				),
			);
			const settingText = USER_SETTINGS.map(
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
			(await this.db.userSettings.get(message.author.id, args.setting)) ??
			false;
		await this.db.userSettings.set(message.author.id, args.setting, !value);
		await message.reply(`${args.setting} has been set to ${!value}.`);
	}
}
