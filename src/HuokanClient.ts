import { SapphireClient } from "@sapphire/framework";
import { Intents } from "discord.js";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/DataStore";
import { RecruitmentModule } from "./modules/recruitment/RecruitmentModule";
import { SettingModule } from "./modules/settings/SettingsModule";

export class HuokanClient extends SapphireClient {
	public readonly configFile: ConfigurationFile;
	public readonly dataStore: DataStore;

	public readonly recruitmentModule: RecruitmentModule;
	public readonly settingModule: SettingModule;

	public constructor(dataStore: DataStore) {
		super({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_INVITES,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.DIRECT_MESSAGES,
			],
			partials: ["CHANNEL"],
			caseInsensitivePrefixes: true,
			caseInsensitiveCommands: true,
			defaultPrefix: "!",
		});
		this.dataStore = dataStore;
		this.recruitmentModule = new RecruitmentModule(this, dataStore);
		this.settingModule = new SettingModule(this, dataStore);
	}
}

declare module "@sapphire/framework" {
	export interface SapphireClient {
		readonly dataStore: DataStore;
		readonly recruitmentModule: RecruitmentModule;
		readonly settingModule: SettingModule;
	}
}
