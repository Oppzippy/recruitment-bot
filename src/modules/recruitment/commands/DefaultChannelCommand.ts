import { Command } from "discord-akairo";
import { TextChannel, Message } from "discord.js";
import { DataStore } from "../../../external/DataStore";

interface InviteChannelArgs {
	channel?: TextChannel;
}

export class DefaultChannelCommand extends Command {
	private db: DataStore;
	constructor(db: DataStore) {
		super("inviteChannel", {
			aliases: ["invitechannel"],
			args: [
				{
					id: "channel",
					type: "textChannel",
				},
			],
			channel: "guild",
			userPermissions: "ADMINISTRATOR",
		});
		this.db = db;
	}

	async exec(message: Message, args: InviteChannelArgs): Promise<void> {
		const repo = this.db.guildSettings;
		const channel = args.channel ?? <TextChannel>message.channel;
		repo.set(message.guild.id, "invite_channel", channel.id);
		message.reply(`the invite channel has been set to <#${channel.id}>.`);
	}
}
