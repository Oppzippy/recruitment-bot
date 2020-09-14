import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import { EventEmitter } from "events";
import { DataStore } from "../../../external/database/DataStore";

export class InviteLeaderboardCommand extends Command {
	private db: DataStore;
	private emitter: EventEmitter;

	constructor(db: DataStore, emitter: EventEmitter) {
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
		this.emitter = emitter;
	}

	async exec(message: Message) {
		if (message.channel instanceof TextChannel) {
			let leaderboardMessage: Message;
			try {
				leaderboardMessage = await message.channel.send(
					"Fetching invite leaderboard...",
				);
				const repo = this.db.inviteLeaderboardRepository;
				await repo.addLeaderboardMessage(
					leaderboardMessage.guild.id,
					leaderboardMessage.channel.id,
					leaderboardMessage.id,
				);
				// TODO only update the newly created message
				this.emitter.emit(
					"updateLeaderboard",
					leaderboardMessage.guild.id,
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
