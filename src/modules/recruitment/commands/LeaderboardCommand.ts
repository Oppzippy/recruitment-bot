import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import { clamp } from "lodash";
import { DataStore } from "../../../external/database/DataStore";
import { LeaderboardManager } from "../leaderboard/LeaderboardManager";
import { LeaderboardOptions } from "../leaderboard/LeaderboardMessageGenerator";

interface LeaderboardArgs {
	size: number;
	dynamic: boolean;
	startDate: Date;
	resetIntervalInDays: number;
}

export class LeaderboardCommand extends Command {
	private db: DataStore;
	private leaderboardManager: LeaderboardManager;

	public constructor(db: DataStore, leaderboardManager: LeaderboardManager) {
		super("inviteLeaderboard", {
			aliases: ["inviteleaderboard"],
			args: [
				{
					id: "size",
					type: "number",
					match: "option",
					flag: "--size",
					default: 10,
				},
				{
					id: "dynamic",
					match: "flag",
					flag: "--dynamic",
				},
				{
					id: "startDate",
					type: "date",
					match: "option",
					flag: "--startDate",
				},
				{
					id: "resetIntervalInDays",
					type: "integer",
					match: "option",
					flag: "--cycle",
				},
			],
			clientPermissions: ["MANAGE_GUILD", "SEND_MESSAGES", "EMBED_LINKS"],
			channel: "guild",
		});

		this.db = db;
		this.leaderboardManager = leaderboardManager;
	}

	public static userPermissions(message: Message): string {
		if (
			message.member.roles.cache.some((role) =>
				role.name.toLowerCase().startsWith("moderator"),
			)
		) {
			return null;
		}
		if (message.member.hasPermission("MANAGE_GUILD")) {
			return null;
		}
		return "MANAGE_GUILD";
	}

	public async exec(message: Message, args: LeaderboardArgs): Promise<void> {
		const options = this.getOptionsFromArgs(args);
		const channel = <TextChannel>message.channel;
		try {
			this.leaderboardManager.postLeaderboard(channel, options);
			await this.deleteMessageIfPermissible(message);
		} catch (err) {
			console.error(err);
		}
	}

	private async deleteMessageIfPermissible(message: Message) {
		if (message.author == this.client.user) {
			message.delete();
		} else if (message.channel instanceof TextChannel) {
			if (
				message.channel
					.permissionsFor(this.client.user)
					.has("MANAGE_MESSAGES")
			) {
				await message.delete();
			}
		}
	}

	private getOptionsFromArgs(args: LeaderboardArgs): LeaderboardOptions {
		const size = clamp(args.size, 1, 50);
		const options: LeaderboardOptions = {
			size,
			isDynamic: args.dynamic,
		};
		if (args.startDate) {
			options.filter = {
				startDate: args.startDate,
				resetIntervalInDays: args.resetIntervalInDays,
			};
		}
		return options;
	}
}
