import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { ArgumentParseError } from "../../../errors/ArgumentParseError";
import { DataStore } from "../../../external/DataStore";

type AddBankGuildCommandArgs = {
	name: string;
	realm?: string;
	delete: boolean;
};

export class AddBankGuildCommand extends Command {
	private db: DataStore;

	public constructor(db: DataStore) {
		super("addbankguild", {
			aliases: ["addbankguild"],
			userPermissions: "MANAGE_GUILD",
			args: [
				{
					id: "name",
					type: "string",
				},
				{
					id: "realm",
					type: "string",
				},
				{
					id: "delete",
					match: "flag",
					flag: ["-d", "--delete", "--remove"],
				},
			],
		});
		this.db = db;
	}

	public async exec(
		message: Message,
		args: AddBankGuildCommandArgs,
	): Promise<void> {
		let guildName: string, guildRealm: string;
		try {
			[guildName, guildRealm] = this.parseGuild(args);
			if (!args.delete) {
				await this.db.bankGuilds.addBankGuild(message.guild.id, {
					name: guildName,
					realm: guildRealm,
				});
				await message.reply(
					`Added bank guild ${guildName}-${guildRealm}`,
				);
			} else {
				await this.db.bankGuilds.removeBankGuild(message.guild.id, {
					name: guildName,
					realm: guildRealm,
				});
				await message.reply(
					`Removed bank guild ${guildName}-${guildRealm}`,
				);
			}
		} catch (err) {
			if (err instanceof ArgumentParseError) {
				message.reply(err.message);
			} else {
				await message.reply(
					`Failed to add guild ${guildName}-${guildRealm}. Perhaps it already exists?`,
				);
			}
		}
	}

	private parseGuild(
		args: AddBankGuildCommandArgs,
	): [name: string, realm: string] {
		const { name, realm } = args;
		if (!name) {
			throw new ArgumentParseError("Please specify a guild and realm.");
		}
		if (!realm) {
			const [splitName, splitRealm] = name.split("-");
			if (!splitRealm) {
				throw new ArgumentParseError("Please specify a realm.");
			}
			return [splitName, splitRealm];
		}
		return [name, realm];
	}
}
