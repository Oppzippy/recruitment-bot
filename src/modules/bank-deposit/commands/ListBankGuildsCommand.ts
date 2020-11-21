import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { groupBy, uniq } from "lodash";
import { DataStore } from "../../../external/DataStore";

export class ListBankGuildsCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("bankguilds", {
			aliases: ["bankguilds"],
			userPermissions: "MANAGE_GUILD",
		});
		this.db = db;
	}

	public async exec(message: Message): Promise<void> {
		const guilds = await this.db.bankGuilds.getBankGuilds(message.guild.id);
		const guildsByRealm = groupBy(guilds, (guild) => guild.realm);
		const realms = uniq(guilds.map((guild) => guild.realm)).sort();

		const formattedGuildsByRealm = realms.map((realm) => {
			const guilds = guildsByRealm[realm];
			const guildNames = guilds.map((guild) => guild.name).sort();
			return `**${realm}**\n${guildNames.join("\n")}`;
		});
		await message.reply(
			`Bank Guilds:\n${formattedGuildsByRealm.join("\n")}`,
		);
	}
}
