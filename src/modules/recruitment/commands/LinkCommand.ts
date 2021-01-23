import { Command } from "discord-akairo";
import { TextChannel, Message } from "discord.js";

export class LinkCommand extends Command {
	public constructor() {
		super("invitelink", {
			aliases: ["invitelink"],
			clientPermissions: ["CREATE_INSTANT_INVITE", "SEND_MESSAGES"],
			channel: "guild",
		});
	}

	public async exec(message: Message): Promise<void> {
		if (message.channel instanceof TextChannel) {
			await message.reply(
				"Registering invite links is no longer necessary. All invite links created after 10:37pm EST on January 22, 2021 will automatically be registered for the leaderboard. Please make sure to create your own invite link rather than using https://discord.gg/huokan in order for the invites to be attributed to you.",
			);
		}
	}
}
