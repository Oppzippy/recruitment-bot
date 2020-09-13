import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import { DataStore } from "../../../external/database/DataStore";

export class InviteLeaderboardCommand extends Command {
	private db: DataStore;

	constructor(db: DataStore) {
		super("inviteLeaderboard", {
			aliases: ["inviteleaderboard"],
			args: [
				{
					id: "size",
					type: "number",
					prompt: {
						start:
							"How many recruiters should be listed on the leaderboard?",
						retry: "Invalid number. Try again.",
						optional: true,
					},
					default: 10,
				},
			],
		});

		this.db = db;
	}

	async exec(message: Message) {
		if (message.channel instanceof TextChannel) {
			let leaderboardMessage: Message;
			try {
				leaderboardMessage = await message.channel.send("leaderboard");
				const repo = this.db.inviteLeaderboardRepository;
				await repo.addLeaderboardMessage(
					leaderboardMessage.guild.id,
					leaderboardMessage.id,
				);
			} catch (err) {
				console.error(err);
				this.editMessageFailedToCreateLeaderboard(leaderboardMessage);
			}
		}
	}

	private editMessageFailedToCreateLeaderboard(message?: Message) {
		if (message) {
			message.edit("Failed to create leaderboard.").catch(console.error);
		}
	}
}
