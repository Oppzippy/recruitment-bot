import { SapphireClient } from "@sapphire/framework";
import { Partials } from "discord.js";
import { ConfigurationFile } from "./configuration-file/ConfigurationFile";
import { DataStore } from "./external/DataStore";
import { RecruitmentModule } from "./modules/recruitment/RecruitmentModule";

export class HuokanClient extends SapphireClient {
	public readonly configFile: ConfigurationFile;
	public readonly dataStore: DataStore;

	public readonly recruitmentModule: RecruitmentModule;

	public constructor(dataStore: DataStore) {
		const defaultPrefix = "!recruitment";
		super({
			intents: [
				"Guilds",
				"GuildInvites",
				"GuildMessages",
				"GuildMembers",
				"DirectMessages",
			],
			partials: [Partials.Channel],
			caseInsensitivePrefixes: true,
			caseInsensitiveCommands: true,
			defaultPrefix,
			fetchPrefix: async (message) => {
				// No prefix in DMs
				return message.guildId == null
					? [defaultPrefix, "!", ""]
					: [defaultPrefix];
			},
		});
		this.dataStore = dataStore;
		this.recruitmentModule = new RecruitmentModule(this, dataStore);
	}
}

declare module "@sapphire/framework" {
	export interface SapphireClient {
		readonly dataStore: DataStore;
		readonly recruitmentModule: RecruitmentModule;
	}
}
