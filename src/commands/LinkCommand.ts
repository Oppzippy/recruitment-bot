import { ApplyOptions } from "@sapphire/decorators";
import { TextChannel, Message } from "discord.js";
import { Command, CommandOptions } from "@sapphire/framework";

@ApplyOptions<CommandOptions>({
	name: "invitelink",
	description: "Gives you an invite link",
	runIn: "GUILD_ANY",
})
export class LinkCommand extends Command {
	public async messageRun(message: Message) {
		if (message.channel instanceof TextChannel) {
			await message.reply(
				"Registering invite links is no longer necessary. All invite links created after 10:37pm EST on January 22, 2021 will automatically be registered for the leaderboard. Please make sure to create your own invite link rather than using https://discord.gg/huokan in order for the invites to be attributed to you.",
			);
		}
	}
}
