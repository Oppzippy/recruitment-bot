import { Command } from "discord-akairo";
import { Message } from "discord.js";

class InviteLinkCommand extends Command {
	constructor() {
		super("invitelink", {
			aliases: ["invitelink"],
		});
	}

	exec(message: Message) {
		message.reply("test");
	}
}

export default InviteLinkCommand;
