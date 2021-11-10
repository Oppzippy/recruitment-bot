import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command, CommandOptions } from "@sapphire/framework";
import * as Sentry from "@sentry/node";
import { Message, TextChannel } from "discord.js";
import { clamp } from "lodash";
import { LeaderboardOptions } from "../../modules/recruitment/leaderboard/LeaderboardOptions";

@ApplyOptions<CommandOptions>({
	name: "leaderboard",
	runIn: "GUILD_ANY",
	cooldownDelay: 120000,
	options: ["size", "startDate", "endDate", "resetIntervalInDays"],
	flags: ["dynamic"],
	requiredClientPermissions: ["MANAGE_GUILD", "SEND_MESSAGES", "EMBED_LINKS"],
	requiredUserPermissions: ["MANAGE_GUILD"],
})
export class LeaderboardCommand extends Command {
	public async messageRun(message: Message, args: Args) {
		const options = this.parseLeaderboardOptions(args);
		const channel = <TextChannel>message.channel;
		try {
			this.container.client.recruitmentModule.leaderboardManager.postLeaderboard(
				channel,
				options,
			);
		} catch (err) {
			console.error(err);
			Sentry.captureException(err);
		}
	}

	private parseLeaderboardOptions(args: Args): LeaderboardOptions {
		// TODO use zod to parse the strings
		const size = args.getOption("size") ?? "10";
		const startDate = args.getOption("startDate");
		const endDate = args.getOption("endDate");
		const resetIntervalInDays = args.getOption("resetIntervalInDays");
		const isDynamic = args.getFlags("dynamic");

		const options: LeaderboardOptions = {
			size: clamp(parseInt(size), 1, 50),
			isDynamic,
		};

		if (startDate || endDate) {
			options.filter = {
				startDate: startDate ? new Date(startDate) : null,
				resetIntervalInDays: resetIntervalInDays
					? clamp(parseInt(resetIntervalInDays), 1, 365)
					: null,
				endDate: endDate ? new Date(endDate) : null,
			};
		}

		return options;
	}
}
